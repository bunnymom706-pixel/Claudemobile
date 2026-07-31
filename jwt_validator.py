#!/usr/bin/env python3
"""Dependency-free JWT (JSON Web Token) validator.

Supports decoding any JWT and verifying HS256-signed tokens.

Usage:
    # Decode only (no signature check):
    python3 jwt_validator.py <token>

    # Decode and verify signature + claims:
    python3 jwt_validator.py <token> --secret <secret>
"""

import argparse
import base64
import binascii
import hashlib
import hmac
import json
import sys
import time
from dataclasses import dataclass, field

ALLOWED_ALGORITHMS = {"HS256"}


class JWTError(Exception):
    """Raised when a token is malformed or fails validation."""


@dataclass
class ValidationResult:
    header: dict
    payload: dict
    signature_verified: bool = False
    errors: list = field(default_factory=list)

    @property
    def valid(self) -> bool:
        return not self.errors


def _b64url_decode(segment: str) -> bytes:
    padded = segment + "=" * (-len(segment) % 4)
    try:
        return base64.urlsafe_b64decode(padded)
    except (binascii.Error, ValueError) as exc:
        raise JWTError(f"invalid base64url segment: {exc}") from exc


def decode(token: str) -> tuple[dict, dict, bytes, str]:
    """Split and decode a JWT without verifying it.

    Returns (header, payload, signature, signing_input).
    """
    parts = token.strip().split(".")
    if len(parts) != 3:
        raise JWTError(f"expected 3 dot-separated segments, got {len(parts)}")

    header_b64, payload_b64, signature_b64 = parts
    try:
        header = json.loads(_b64url_decode(header_b64))
        payload = json.loads(_b64url_decode(payload_b64))
    except json.JSONDecodeError as exc:
        raise JWTError(f"segment is not valid JSON: {exc}") from exc

    if not isinstance(header, dict) or not isinstance(payload, dict):
        raise JWTError("header and payload must be JSON objects")

    signature = _b64url_decode(signature_b64)
    signing_input = f"{header_b64}.{payload_b64}"
    return header, payload, signature, signing_input


def verify_signature(header: dict, signature: bytes, signing_input: str,
                     secret: str) -> None:
    """Verify an HS256 signature. Raises JWTError on failure."""
    alg = header.get("alg")
    if alg not in ALLOWED_ALGORITHMS:
        # Rejecting everything outside the allowlist also blocks the
        # classic "alg": "none" bypass.
        raise JWTError(f"algorithm {alg!r} is not allowed")

    expected = hmac.new(secret.encode(), signing_input.encode(),
                        hashlib.sha256).digest()
    if not hmac.compare_digest(expected, signature):
        raise JWTError("signature verification failed")


def validate_claims(payload: dict, now: float | None = None,
                    leeway: int = 60) -> list[str]:
    """Check registered time claims. Returns a list of error strings."""
    now = time.time() if now is None else now
    errors = []

    exp = payload.get("exp")
    if exp is None:
        errors.append("missing required claim: exp")
    elif not isinstance(exp, (int, float)):
        errors.append("exp claim must be a number")
    elif now > exp + leeway:
        errors.append(f"token expired at {exp} (now {int(now)})")

    for claim in ("iat", "nbf"):
        value = payload.get(claim)
        if value is None:
            continue
        if not isinstance(value, (int, float)):
            errors.append(f"{claim} claim must be a number")
        elif now < value - leeway:
            errors.append(f"{claim} is in the future ({value}, now {int(now)})")

    return errors


def validate(token: str, secret: str | None = None,
             now: float | None = None, leeway: int = 60) -> ValidationResult:
    """Validate a JWT. If secret is given, the signature is verified too."""
    header, payload, signature, signing_input = decode(token)
    result = ValidationResult(header=header, payload=payload)

    if secret is not None:
        try:
            verify_signature(header, signature, signing_input, secret)
            result.signature_verified = True
        except JWTError as exc:
            result.errors.append(str(exc))

    result.errors.extend(validate_claims(payload, now=now, leeway=leeway))
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("token", help="the JWT to validate")
    parser.add_argument("--secret", help="HS256 secret; enables signature "
                        "verification")
    parser.add_argument("--leeway", type=int, default=60,
                        help="clock-skew leeway in seconds (default 60)")
    args = parser.parse_args(argv)

    try:
        result = validate(args.token, secret=args.secret, leeway=args.leeway)
    except JWTError as exc:
        print(f"INVALID: {exc}", file=sys.stderr)
        return 1

    print("header:", json.dumps(result.header, indent=2))
    print("payload:", json.dumps(result.payload, indent=2))
    if args.secret:
        print("signature:", "verified" if result.signature_verified
              else "NOT verified")
    else:
        print("signature: not checked (no --secret provided)")

    if result.valid:
        print("result: VALID" if args.secret else "result: claims OK")
        return 0
    for err in result.errors:
        print(f"error: {err}", file=sys.stderr)
    print("result: INVALID", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
