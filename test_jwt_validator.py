#!/usr/bin/env python3
"""Tests for jwt_validator. Run with: python3 -m unittest"""

import base64
import hashlib
import hmac
import json
import time
import unittest

import jwt_validator

SECRET = "test-secret"


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def make_token(payload: dict, secret: str = SECRET,
               header: dict | None = None, signature: bytes | None = None):
    header = header or {"alg": "HS256", "typ": "JWT"}
    signing_input = f"{b64url(json.dumps(header).encode())}." \
                    f"{b64url(json.dumps(payload).encode())}"
    if signature is None:
        signature = hmac.new(secret.encode(), signing_input.encode(),
                             hashlib.sha256).digest()
    return f"{signing_input}.{b64url(signature)}"


class DecodeTests(unittest.TestCase):
    def test_decodes_header_and_payload(self):
        token = make_token({"sub": "user-1", "exp": int(time.time()) + 60})
        header, payload, _, _ = jwt_validator.decode(token)
        self.assertEqual(header["alg"], "HS256")
        self.assertEqual(payload["sub"], "user-1")

    def test_rejects_wrong_segment_count(self):
        with self.assertRaises(jwt_validator.JWTError):
            jwt_validator.decode("only.two")

    def test_rejects_non_json_segment(self):
        with self.assertRaises(jwt_validator.JWTError):
            jwt_validator.decode("bm90anNvbg.bm90anNvbg.sig")


class SignatureTests(unittest.TestCase):
    def test_valid_signature(self):
        token = make_token({"exp": int(time.time()) + 60})
        result = jwt_validator.validate(token, secret=SECRET)
        self.assertTrue(result.valid)
        self.assertTrue(result.signature_verified)

    def test_wrong_secret_fails(self):
        token = make_token({"exp": int(time.time()) + 60})
        result = jwt_validator.validate(token, secret="wrong")
        self.assertFalse(result.valid)
        self.assertFalse(result.signature_verified)

    def test_tampered_payload_fails(self):
        token = make_token({"exp": int(time.time()) + 60, "role": "user"})
        head, _, sig = token.split(".")
        forged = b64url(json.dumps(
            {"exp": int(time.time()) + 60, "role": "admin"}).encode())
        result = jwt_validator.validate(f"{head}.{forged}.{sig}",
                                        secret=SECRET)
        self.assertFalse(result.valid)

    def test_alg_none_rejected(self):
        token = make_token({"exp": int(time.time()) + 60},
                           header={"alg": "none", "typ": "JWT"},
                           signature=b"")
        result = jwt_validator.validate(token, secret=SECRET)
        self.assertFalse(result.valid)
        self.assertIn("not allowed", result.errors[0])


class ClaimTests(unittest.TestCase):
    def test_expired_token(self):
        token = make_token({"exp": int(time.time()) - 3600})
        result = jwt_validator.validate(token, secret=SECRET)
        self.assertFalse(result.valid)
        self.assertTrue(any("expired" in e for e in result.errors))

    def test_missing_exp(self):
        token = make_token({"sub": "user-1"})
        result = jwt_validator.validate(token, secret=SECRET)
        self.assertFalse(result.valid)

    def test_future_nbf_rejected(self):
        token = make_token({"exp": int(time.time()) + 7200,
                            "nbf": int(time.time()) + 3600})
        result = jwt_validator.validate(token, secret=SECRET)
        self.assertFalse(result.valid)

    def test_leeway_allows_small_skew(self):
        token = make_token({"exp": int(time.time()) - 30})
        result = jwt_validator.validate(token, secret=SECRET, leeway=60)
        self.assertTrue(result.valid)


if __name__ == "__main__":
    unittest.main()
