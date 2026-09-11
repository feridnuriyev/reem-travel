"""Backend tests for Reem Travel API.

Covers:
- Public: root, hotels (list/get), reviews (list approved + create pending), bookings, inquiries (create)
- Admin auth: login -> 2FA setup -> 2FA verify -> /admin/me
- Admin protected endpoints: hotels/reviews/bookings/inquiries/stats (401 unauth + 200 with token)
- Negative auth: wrong password, wrong 2FA code
"""
import os

import pyotp
import pytest
import requests

def _required_test_setting(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        pytest.skip(f"{name} is required for integration tests")
    return value


@pytest.fixture(scope="session", autouse=True)
def integration_test_guard():
    """Ensure this suite cannot run against any environment by accident."""
    if os.environ.get("REEM_RUN_INTEGRATION_TESTS") != "1":
        pytest.skip("Set REEM_RUN_INTEGRATION_TESTS=1 to run integration tests")
    _required_test_setting("REEM_TEST_API_URL")
    _required_test_setting("REEM_TEST_ADMIN_EMAIL")
    _required_test_setting("REEM_TEST_ADMIN_PASSWORD")
    _required_test_setting("REEM_TEST_TOTP_SECRET")


API = os.environ.get("REEM_TEST_API_URL", "").rstrip("/") + "/api"
ADMIN_EMAIL = os.environ.get("REEM_TEST_ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.environ.get("REEM_TEST_ADMIN_PASSWORD", "")
TOTP_SECRET = os.environ.get("REEM_TEST_TOTP_SECRET", "")


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ============================================================================
# Public root
# ============================================================================
def test_root_greeting(session):
    r = session.get(f"{API}/", timeout=20)
    assert r.status_code == 200
    assert "Reem" in r.json().get("message", "")


# ============================================================================
# Hotels (public)
# ============================================================================
class TestHotelsPublic:
    def test_list_hotels_8_seeded(self, session):
        r = session.get(f"{API}/hotels", timeout=20)
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 8, f"Expected >=8 hotels, got {len(items)}"
        h = items[0]
        assert "_id" not in h
        assert "id" in h and "name" in h and "city" in h
        assert "rooms" in h and isinstance(h["rooms"], list)
        assert "starting_price" in h
        # rooms have prices
        if h["rooms"]:
            room = h["rooms"][0]
            assert "price_per_night" in room
            assert "name" in room

    def test_get_single_hotel(self, session):
        r = session.get(f"{API}/hotels", timeout=20)
        hotel_id = r.json()[0]["id"]
        r2 = session.get(f"{API}/hotels/{hotel_id}", timeout=20)
        assert r2.status_code == 200
        h = r2.json()
        assert h["id"] == hotel_id
        assert "_id" not in h

    def test_get_hotel_not_found(self, session):
        r = session.get(f"{API}/hotels/nonexistent-id-xyz", timeout=20)
        assert r.status_code == 404


# ============================================================================
# Reviews (public)
# ============================================================================
class TestReviewsPublic:
    def test_list_returns_only_approved(self, session):
        r = session.get(f"{API}/reviews", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        for it in items:
            assert it.get("approved") is True
            assert "_id" not in it

    def test_create_review_is_pending(self, session):
        payload = {
            "name": "TEST_Reviewer",
            "country": "TR",
            "rating": 5,
            "text": "TEST_This is a great review long enough to pass validation.",
        }
        r = session.post(f"{API}/reviews", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["approved"] is False
        assert data["name"] == payload["name"]
        # Verify not in public list
        r2 = session.get(f"{API}/reviews", timeout=20)
        ids = [it["id"] for it in r2.json()]
        assert data["id"] not in ids


# ============================================================================
# Bookings (public create)
# ============================================================================
class TestBookings:
    def test_create_booking(self, session):
        hotels = session.get(f"{API}/hotels", timeout=20).json()
        hotel = hotels[0]
        payload = {
            "first_name": "TEST_Jane",
            "last_name": "TEST_Doe",
            "phone": "+905551234567",
            "whatsapp_same": True,
            "hotel_id": hotel["id"],
            "hotel_name": hotel["name"],
            "check_in": "2026-06-15",
            "check_out": "2026-06-22",
            "guests": 2,
            "notes": "TEST_booking",
        }
        r = session.post(f"{API}/bookings", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        b = r.json()
        assert b["first_name"] == "TEST_Jane"
        assert b["whatsapp_phone"] == payload["phone"]
        assert b["status"] == "pending"
        assert "_id" not in b
        assert "id" in b

    def test_create_booking_missing_required(self, session):
        r = session.post(f"{API}/bookings", json={"first_name": "x"}, timeout=20)
        assert r.status_code == 422


# ============================================================================
# Inquiries (create public)
# ============================================================================
def test_create_inquiry_public(session):
    payload = {
        "name": "TEST_Inq",
        "email": "test_inq@example.com",
        "message": "TEST_Inquiry message long enough.",
    }
    r = session.post(f"{API}/inquiries", json=payload, timeout=20)
    assert r.status_code == 200
    assert "_id" not in r.json()


# ============================================================================
# Admin Auth — login, 2FA setup, 2FA verify
# ============================================================================
@pytest.fixture(scope="session")
def admin_tokens(session):
    """Full admin login flow: login -> setup(if needed) -> verify -> access_token."""
    # Step 1: login
    r = session.post(
        f"{API}/admin/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    temp_token = data["temp_token"]
    requires_setup = data["requires_2fa_setup"]

    # Step 2: set up a fresh test admin, or use the injected test TOTP secret.
    setup_headers = {"Authorization": f"Bearer {temp_token}"}
    secret = None
    if requires_setup:
        r2 = session.post(f"{API}/admin/2fa/setup", headers=setup_headers, timeout=20)
        assert r2.status_code == 200, r2.text
        setup_data = r2.json()
        assert setup_data["qr_data_uri"].startswith("data:image/png;base64,")
        assert isinstance(setup_data["secret"], str) and len(setup_data["secret"]) >= 16
        secret = setup_data["secret"]
    else:
        # The test TOTP secret is injected by CI/a local secret manager.
        # Tests must never read or mutate MongoDB directly to reset 2FA.
        secret = TOTP_SECRET

    # Step 3: verify
    code = pyotp.TOTP(secret).now()
    r3 = session.post(
        f"{API}/admin/2fa/verify",
        headers=setup_headers,
        json={"code": code},
        timeout=20,
    )
    assert r3.status_code == 200, f"verify failed: {r3.status_code} {r3.text}"
    out = r3.json()
    assert "access_token" in out
    assert out["admin"]["email"] == ADMIN_EMAIL.lower()

    return {
        "temp_token": temp_token,
        "secret": secret,
        "access_token": out["access_token"],
    }


class TestAdminAuthNegative:
    def test_login_wrong_password(self, session):
        r = session.post(
            f"{API}/admin/login",
            json={"email": ADMIN_EMAIL, "password": "wrong-password!"},
            timeout=20,
        )
        assert r.status_code == 401

    def test_login_unknown_email(self, session):
        r = session.post(
            f"{API}/admin/login",
            json={"email": "nobody@example.com", "password": "x"},
            timeout=20,
        )
        assert r.status_code == 401

    def test_2fa_verify_wrong_code(self, session, admin_tokens):
        # Login again to get a fresh temp token (admin_tokens already enabled 2FA)
        r = session.post(
            f"{API}/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=20,
        )
        assert r.status_code == 200
        temp_token = r.json()["temp_token"]
        r2 = session.post(
            f"{API}/admin/2fa/verify",
            headers={"Authorization": f"Bearer {temp_token}"},
            json={"code": "000000"},
            timeout=20,
        )
        assert r2.status_code == 401


class TestAdminMe:
    def test_admin_me(self, session, admin_tokens):
        r = session.get(
            f"{API}/admin/me",
            headers={"Authorization": f"Bearer {admin_tokens['access_token']}"},
            timeout=20,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL.lower()
        assert "password_hash" not in data
        assert "totp_secret" not in data

    def test_admin_me_no_token(self, session):
        r = session.get(f"{API}/admin/me", timeout=20)
        assert r.status_code == 401


# ============================================================================
# Admin protected endpoints — auth gating + happy paths
# ============================================================================
PROTECTED_GETS = [
    "/admin/stats",
    "/admin/bookings",
    "/admin/reviews",
    "/inquiries",
]


class TestAdminProtectedAuth:
    @pytest.mark.parametrize("path", PROTECTED_GETS)
    def test_no_token_returns_401(self, session, path):
        r = session.get(f"{API}{path}", timeout=20)
        assert r.status_code == 401, f"{path} expected 401, got {r.status_code}"

    def test_admin_create_hotel_no_token(self, session):
        r = session.post(f"{API}/admin/hotels", json={"name": "x", "city": "y"}, timeout=20)
        assert r.status_code in (401, 422)  # 401 preferred; 422 if validation runs first
        # Stronger check — ensure auth gates before persisting
        r2 = session.post(
            f"{API}/admin/hotels",
            json={"name": "TEST_x", "city": "Antalya", "stars": 5},
            timeout=20,
        )
        assert r2.status_code == 401


class TestAdminProtectedHappy:
    @pytest.fixture
    def auth_headers(self, admin_tokens):
        return {"Authorization": f"Bearer {admin_tokens['access_token']}"}

    def test_stats(self, session, auth_headers):
        r = session.get(f"{API}/admin/stats", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ["hotels", "bookings", "inquiries", "reviews_total", "reviews_pending"]:
            assert k in d
        assert d["hotels"] >= 8

    def test_bookings_list(self, session, auth_headers):
        r = session.get(f"{API}/admin/bookings", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        for it in items:
            assert "_id" not in it

    def test_inquiries_list_with_token(self, session, auth_headers):
        r = session.get(f"{API}/inquiries", headers=auth_headers, timeout=20)
        assert r.status_code == 200

    def test_review_approval_flow(self, session, auth_headers):
        # Create pending review
        r = session.post(
            f"{API}/reviews",
            json={
                "name": "TEST_PendingMod",
                "country": "TR",
                "rating": 4,
                "text": "TEST_Pending review awaiting approval flow test long enough.",
            },
            timeout=20,
        )
        assert r.status_code == 200
        rid = r.json()["id"]

        # Approve
        r2 = session.post(
            f"{API}/admin/reviews/{rid}/approve", headers=auth_headers, timeout=20
        )
        assert r2.status_code == 200
        assert r2.json()["approved"] is True

        # Now appears in public
        r3 = session.get(f"{API}/reviews", timeout=20)
        ids = [it["id"] for it in r3.json()]
        assert rid in ids

        # Delete it (cleanup)
        r4 = session.delete(f"{API}/admin/reviews/{rid}", headers=auth_headers, timeout=20)
        assert r4.status_code == 200
        # Verify removed
        r5 = session.get(f"{API}/reviews", timeout=20)
        ids2 = [it["id"] for it in r5.json()]
        assert rid not in ids2

    def test_admin_create_hotel(self, session, auth_headers):
        payload = {
            "name": "TEST_Hotel_X",
            "city": "Antalya",
            "region": "Lara",
            "stars": 4,
            "description": "TEST",
            "starting_price": 100,
            "rooms": [
                {"name": "Std", "price_per_night": 100, "capacity": 2}
            ],
        }
        r = session.post(
            f"{API}/admin/hotels", json=payload, headers=auth_headers, timeout=20
        )
        assert r.status_code == 200, r.text
        h = r.json()
        hid = h["id"]
        assert h["name"] == "TEST_Hotel_X"
        assert len(h["rooms"]) == 1
        # Cleanup
        rd = session.delete(
            f"{API}/admin/hotels/{hid}", headers=auth_headers, timeout=20
        )
        assert rd.status_code == 200
