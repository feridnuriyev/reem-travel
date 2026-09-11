import base64
import io
import logging
import os
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import bcrypt
import jwt
import pyotp
import qrcode
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ----------------------------------------------------------------------------
# Logging
# ----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------------
# DB
# ----------------------------------------------------------------------------
def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


mongo_url = required_env("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[required_env("DB_NAME")]

# ----------------------------------------------------------------------------
# Constants & helpers
# ----------------------------------------------------------------------------
JWT_ALG = "HS256"
ACCESS_TOKEN_TTL_MIN = 60 * 8  # 8h
TEMP_TOKEN_TTL_MIN = 5
APP_NAME = "Reem Travel Admin"

bearer_scheme = HTTPBearer(auto_error=False)


def jwt_secret() -> str:
    secret = required_env("JWT_SECRET")
    if len(secret) < 32:
        raise RuntimeError("JWT_SECRET must be at least 32 characters long")
    return secret


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def make_token(sub: str, scope: str, ttl_min: int) -> str:
    payload = {
        "sub": sub,
        "scope": scope,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ttl_min),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALG)


def decode_token(token: str, expected_scope: str) -> dict:
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("scope") != expected_scope:
        raise HTTPException(status_code=401, detail="Invalid token scope")
    return payload


async def get_admin(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(creds.credentials, "access")
    admin = await db.admins.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0, "totp_secret": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin


# ----------------------------------------------------------------------------
# App & router
# ----------------------------------------------------------------------------
app = FastAPI(title="Reem Travel API")
api = APIRouter(prefix="/api")

# ============================================================================
# Models
# ============================================================================


class InquiryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=40)
    service: Optional[str] = Field(None, max_length=80)
    travel_dates: Optional[str] = Field(None, max_length=80)
    travelers: Optional[str] = Field(None, max_length=20)
    message: str = Field(..., min_length=2, max_length=2000)
    language: Optional[str] = Field("en", max_length=4)


class Inquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    service: Optional[str] = None
    travel_dates: Optional[str] = None
    travelers: Optional[str] = None
    message: str
    language: Optional[str] = "en"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = Field("", max_length=2000)
    capacity: int = Field(2, ge=1, le=20)
    price_per_night: float = Field(..., ge=0)
    currency: str = Field("EUR", max_length=4)
    images: List[str] = Field(default_factory=list)
    amenities: List[str] = Field(default_factory=list)


class Room(RoomBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class HotelBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)
    city: str = Field(..., min_length=2, max_length=80)
    region: Optional[str] = Field("", max_length=80)
    stars: int = Field(5, ge=1, le=5)
    description: str = Field("", max_length=4000)
    cover_image: str = Field("", max_length=600)
    gallery: List[str] = Field(default_factory=list)
    amenities: List[str] = Field(default_factory=list)
    starting_price: Optional[float] = Field(None, ge=0)
    currency: str = Field("EUR", max_length=4)
    featured: bool = False


class HotelCreate(HotelBase):
    rooms: List[RoomBase] = Field(default_factory=list)


class HotelUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    stars: Optional[int] = Field(None, ge=1, le=5)
    description: Optional[str] = None
    cover_image: Optional[str] = None
    gallery: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    starting_price: Optional[float] = None
    currency: Optional[str] = None
    featured: Optional[bool] = None


class Hotel(HotelBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rooms: List[Room] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReviewCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    country: Optional[str] = Field("", max_length=80)
    rating: int = Field(5, ge=1, le=5)
    text: str = Field(..., min_length=10, max_length=1200)
    hotel_id: Optional[str] = None


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    country: Optional[str] = ""
    rating: int = 5
    text: str
    hotel_id: Optional[str] = None
    approved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BookingCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=60)
    last_name: str = Field(..., min_length=1, max_length=60)
    phone: str = Field(..., min_length=6, max_length=30)
    whatsapp_same: bool = True
    whatsapp_phone: Optional[str] = Field(None, max_length=30)
    email: Optional[EmailStr] = None
    hotel_id: str
    hotel_name: str
    room_id: Optional[str] = None
    room_name: Optional[str] = None
    check_in: str = Field(..., max_length=40)
    check_out: str = Field(..., max_length=40)
    guests: int = Field(2, ge=1, le=20)
    notes: Optional[str] = Field("", max_length=1500)


class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    phone: str
    whatsapp_phone: Optional[str] = None
    email: Optional[str] = None
    hotel_id: str
    hotel_name: str
    room_id: Optional[str] = None
    room_name: Optional[str] = None
    check_in: str
    check_out: str
    guests: int = 2
    notes: Optional[str] = ""
    status: str = "pending"  # pending, confirmed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---- Auth schemas ----
class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class TwoFAVerify(BaseModel):
    code: str = Field(..., min_length=6, max_length=8)


# ============================================================================
# Public — Inquiries
# ============================================================================


@api.get("/")
async def root():
    return {"message": "Reem Travel API is running"}


@api.post("/inquiries", response_model=Inquiry)
async def create_inquiry(payload: InquiryCreate):
    inquiry = Inquiry(**payload.model_dump())
    doc = inquiry.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.inquiries.insert_one(doc)
    return inquiry


@api.get("/inquiries", response_model=List[Inquiry])
async def list_inquiries(_: dict = Depends(get_admin), limit: int = 200):
    items = await db.inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items


# ============================================================================
# Public — Hotels & Rooms (read), Reviews (read approved + write pending)
# ============================================================================


@api.get("/hotels", response_model=List[Hotel])
async def list_hotels(featured: Optional[bool] = None, city: Optional[str] = None):
    q = {}
    if featured is not None:
        q["featured"] = featured
    if city:
        q["city"] = city
    items = await db.hotels.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items


@api.get("/hotels/{hotel_id}", response_model=Hotel)
async def get_hotel(hotel_id: str):
    hotel = await db.hotels.find_one({"id": hotel_id}, {"_id": 0})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if isinstance(hotel.get("created_at"), str):
        hotel["created_at"] = datetime.fromisoformat(hotel["created_at"])
    return hotel


@api.get("/reviews", response_model=List[Review])
async def list_reviews(limit: int = 50):
    items = await db.reviews.find({"approved": True}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items


@api.post("/reviews", response_model=Review)
async def create_review(payload: ReviewCreate):
    review = Review(**payload.model_dump(), approved=False)
    doc = review.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.reviews.insert_one(doc)
    return review


@api.post("/bookings", response_model=Booking)
async def create_booking(payload: BookingCreate):
    try:
        check_in = date.fromisoformat(payload.check_in)
        check_out = date.fromisoformat(payload.check_out)
    except ValueError:
        raise HTTPException(status_code=422, detail="Dates must use YYYY-MM-DD format")
    if check_out <= check_in:
        raise HTTPException(status_code=422, detail="Check-out must be after check-in")

    hotel = await db.hotels.find_one({"id": payload.hotel_id}, {"_id": 0})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    room = None
    if payload.room_id:
        room = next((item for item in hotel.get("rooms", []) if item["id"] == payload.room_id), None)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found for this hotel")
        if payload.guests > room["capacity"]:
            raise HTTPException(status_code=422, detail="Guest count exceeds room capacity")

    data = payload.model_dump()
    if payload.whatsapp_same or not data.get("whatsapp_phone"):
        data["whatsapp_phone"] = payload.phone
    data.pop("whatsapp_same", None)
    # Names presented to customers must come from the server-side hotel record.
    data["hotel_name"] = hotel["name"]
    if room:
        data["room_name"] = room["name"]
    booking = Booking(**data)
    doc = booking.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.bookings.insert_one(doc)
    logger.info(f"New booking {booking.id} — {booking.first_name} {booking.last_name} → {booking.hotel_name}")
    return booking


# ============================================================================
# Admin auth — login → 2FA setup (first time) → 2FA verify → access
# ============================================================================


@api.post("/admin/login")
async def admin_login(payload: AdminLogin):
    admin = await db.admins.find_one({"email": payload.email.lower()})
    if not admin or not verify_password(payload.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    requires_setup = not bool(admin.get("totp_enabled"))
    temp_token = make_token(admin["id"], "2fa", TEMP_TOKEN_TTL_MIN)
    return {
        "temp_token": temp_token,
        "requires_2fa_setup": requires_setup,
    }


@api.post("/admin/2fa/setup")
async def admin_2fa_setup(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(creds.credentials, "2fa")
    admin = await db.admins.find_one({"id": payload["sub"]})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    # If already enabled, do not regenerate
    if admin.get("totp_enabled"):
        raise HTTPException(status_code=400, detail="2FA already enabled")
    secret = admin.get("totp_secret") or pyotp.random_base32()
    await db.admins.update_one({"id": admin["id"]}, {"$set": {"totp_secret": secret}})
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=admin["email"], issuer_name=APP_NAME)
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return {
        "qr_data_uri": f"data:image/png;base64,{qr_b64}",
        "secret": secret,
        "otpauth_uri": uri,
    }


@api.post("/admin/2fa/verify")
async def admin_2fa_verify(body: TwoFAVerify, creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(creds.credentials, "2fa")
    admin = await db.admins.find_one({"id": payload["sub"]})
    if not admin or not admin.get("totp_secret"):
        raise HTTPException(status_code=400, detail="2FA not initialised")
    totp = pyotp.TOTP(admin["totp_secret"])
    if not totp.verify(body.code.strip(), valid_window=1):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")
    if not admin.get("totp_enabled"):
        await db.admins.update_one({"id": admin["id"]}, {"$set": {"totp_enabled": True}})
    access = make_token(admin["id"], "access", ACCESS_TOKEN_TTL_MIN)
    return {
        "access_token": access,
        "token_type": "Bearer",
        "expires_in": ACCESS_TOKEN_TTL_MIN * 60,
        "admin": {"id": admin["id"], "email": admin["email"], "name": admin.get("name", "Admin")},
    }


@api.get("/admin/me")
async def admin_me(admin: dict = Depends(get_admin)):
    return admin


# ============================================================================
# Admin protected — Hotels CRUD
# ============================================================================


@api.post("/admin/hotels", response_model=Hotel)
async def admin_create_hotel(payload: HotelCreate, _: dict = Depends(get_admin)):
    rooms = [Room(**r.model_dump()) for r in payload.rooms]
    hotel = Hotel(**payload.model_dump(exclude={"rooms"}), rooms=rooms)
    doc = hotel.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.hotels.insert_one(doc)
    return hotel


@api.patch("/admin/hotels/{hotel_id}", response_model=Hotel)
async def admin_update_hotel(hotel_id: str, payload: HotelUpdate, _: dict = Depends(get_admin)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.hotels.update_one({"id": hotel_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hotel not found")
    hotel = await db.hotels.find_one({"id": hotel_id}, {"_id": 0})
    if isinstance(hotel.get("created_at"), str):
        hotel["created_at"] = datetime.fromisoformat(hotel["created_at"])
    return hotel


@api.delete("/admin/hotels/{hotel_id}")
async def admin_delete_hotel(hotel_id: str, _: dict = Depends(get_admin)):
    res = await db.hotels.delete_one({"id": hotel_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return {"ok": True}


@api.post("/admin/hotels/{hotel_id}/rooms", response_model=Hotel)
async def admin_add_room(hotel_id: str, payload: RoomBase, _: dict = Depends(get_admin)):
    hotel = await db.hotels.find_one({"id": hotel_id})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    new_room = Room(**payload.model_dump())
    await db.hotels.update_one({"id": hotel_id}, {"$push": {"rooms": new_room.model_dump()}})
    hotel = await db.hotels.find_one({"id": hotel_id}, {"_id": 0})
    if isinstance(hotel.get("created_at"), str):
        hotel["created_at"] = datetime.fromisoformat(hotel["created_at"])
    return hotel


@api.delete("/admin/hotels/{hotel_id}/rooms/{room_id}")
async def admin_delete_room(hotel_id: str, room_id: str, _: dict = Depends(get_admin)):
    res = await db.hotels.update_one({"id": hotel_id}, {"$pull": {"rooms": {"id": room_id}}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return {"ok": True}


# ============================================================================
# Admin protected — Reviews moderation, Bookings list
# ============================================================================


@api.get("/admin/reviews", response_model=List[Review])
async def admin_list_reviews(_: dict = Depends(get_admin), only_pending: bool = False):
    q = {"approved": False} if only_pending else {}
    items = await db.reviews.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items


@api.post("/admin/reviews/{review_id}/approve", response_model=Review)
async def admin_approve_review(review_id: str, _: dict = Depends(get_admin)):
    res = await db.reviews.update_one({"id": review_id}, {"$set": {"approved": True}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if isinstance(review.get("created_at"), str):
        review["created_at"] = datetime.fromisoformat(review["created_at"])
    return review


@api.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, _: dict = Depends(get_admin)):
    res = await db.reviews.delete_one({"id": review_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"ok": True}


@api.get("/admin/bookings", response_model=List[Booking])
async def admin_list_bookings(_: dict = Depends(get_admin)):
    items = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items


@api.patch("/admin/bookings/{booking_id}")
async def admin_update_booking(booking_id: str, body: dict, _: dict = Depends(get_admin)):
    allowed = {k: v for k, v in body.items() if k in {"status", "notes"}}
    if not allowed:
        raise HTTPException(status_code=400, detail="No allowed fields")
    res = await db.bookings.update_one({"id": booking_id}, {"$set": allowed})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"ok": True}


@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(get_admin)):
    return {
        "hotels": await db.hotels.count_documents({}),
        "bookings": await db.bookings.count_documents({}),
        "bookings_pending": await db.bookings.count_documents({"status": "pending"}),
        "inquiries": await db.inquiries.count_documents({}),
        "reviews_total": await db.reviews.count_documents({}),
        "reviews_pending": await db.reviews.count_documents({"approved": False}),
    }


# ============================================================================
# Startup: seed admin + hotels
# ============================================================================


async def seed_admin():
    email = os.environ["ADMIN_EMAIL"].lower()
    password = os.environ["ADMIN_PASSWORD"]
    existing = await db.admins.find_one({"email": email})
    if existing is None:
        admin_id = str(uuid.uuid4())
        await db.admins.insert_one(
            {
                "id": admin_id,
                "email": email,
                "name": "Reservation Admin",
                "password_hash": hash_password(password),
                "totp_secret": None,
                "totp_enabled": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        logger.info(f"Seeded admin: {email}")
    else:
        # Keep password in sync if env value changed
        if not verify_password(password, existing["password_hash"]):
            await db.admins.update_one(
                {"email": email}, {"$set": {"password_hash": hash_password(password)}}
            )
            logger.info(f"Updated admin password for {email}")


SEED_HOTELS = [
    {
        "name": "Maxx Royal Belek Golf Resort",
        "city": "Antalya",
        "region": "Belek",
        "stars": 5,
        "description": "Beachfront ultra-luxury resort on the Mediterranean coast with private beach, championship golf course and award-winning spa.",
        "cover_image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=80",
        ],
        "amenities": ["Private beach", "Spa", "Golf", "Family pool", "All inclusive"],
        "starting_price": 320,
        "featured": True,
        "rooms": [
            {"name": "Deluxe Sea View", "description": "King bed, balcony, sea view, 42 sqm.", "capacity": 2, "price_per_night": 320, "amenities": ["Sea view", "Balcony", "Mini bar"], "images": ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80"]},
            {"name": "Family Suite", "description": "Two bedrooms, living area, sea view, 75 sqm.", "capacity": 4, "price_per_night": 540, "amenities": ["Two bedrooms", "Sea view", "Bath tub"], "images": ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"]},
            {"name": "Beach Villa", "description": "Private villa with pool, direct beach access, 180 sqm.", "capacity": 6, "price_per_night": 1180, "amenities": ["Private pool", "Beachfront", "Butler"], "images": ["https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80"]},
        ],
    },
    {
        "name": "Rixos Premium Bodrum",
        "city": "Muğla",
        "region": "Bodrum",
        "stars": 5,
        "description": "Tucked into a private bay in Bodrum with panoramic Aegean views, private beach coves and authentic Turkish hospitality.",
        "cover_image": "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1600&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1400&q=80",
        ],
        "amenities": ["Private bay", "Yacht charter", "Spa", "Kids club", "All inclusive"],
        "starting_price": 280,
        "featured": True,
        "rooms": [
            {"name": "Premium Sea View", "description": "King bed, balcony with bay view.", "capacity": 2, "price_per_night": 280, "amenities": ["Sea view", "Balcony"], "images": ["https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80"]},
            {"name": "Junior Suite", "description": "Open-plan suite with terrace and seating area.", "capacity": 3, "price_per_night": 420, "amenities": ["Terrace", "Sea view", "Espresso machine"], "images": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"]},
        ],
    },
    {
        "name": "Mandarin Oriental Bodrum",
        "city": "Muğla",
        "region": "Bodrum",
        "stars": 5,
        "description": "Refined Aegean elegance with two beaches, a serene spa and Michelin-level dining.",
        "cover_image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=80",
        "gallery": ["https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=80"],
        "amenities": ["Two private beaches", "Marina", "Spa", "Fine dining"],
        "starting_price": 410,
        "featured": True,
        "rooms": [
            {"name": "Premier Bay View", "description": "Luxurious 50 sqm room with bay views.", "capacity": 2, "price_per_night": 410, "amenities": ["Bay view", "Marble bath"], "images": ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80"]},
            {"name": "Mandarin Suite", "description": "Elegant suite with separate living area and terrace.", "capacity": 3, "price_per_night": 720, "amenities": ["Terrace", "Living area", "Sea view"], "images": ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80"]},
        ],
    },
    {
        "name": "Hillside Beach Club Fethiye",
        "city": "Muğla",
        "region": "Fethiye",
        "stars": 5,
        "description": "Adults-friendly all-inclusive resort tucked between pine forests and a private cove of crystal-clear sea.",
        "cover_image": "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80",
        "gallery": ["https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1400&q=80"],
        "amenities": ["Private cove", "Watersports", "Spa", "All inclusive"],
        "starting_price": 260,
        "featured": True,
        "rooms": [
            {"name": "Sea View Room", "description": "Balcony room overlooking the cove.", "capacity": 2, "price_per_night": 260, "amenities": ["Sea view", "Balcony"], "images": ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80"]},
            {"name": "Family Connecting", "description": "Two connecting rooms for families.", "capacity": 4, "price_per_night": 460, "amenities": ["Two rooms", "Sea view"], "images": ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"]},
        ],
    },
    {
        "name": "Regnum Carya Antalya",
        "city": "Antalya",
        "region": "Belek",
        "stars": 5,
        "description": "An expansive resort known for its golf, water park and lavish villa accommodations.",
        "cover_image": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80",
        "gallery": ["https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80"],
        "amenities": ["Aquapark", "Golf", "Spa", "All inclusive", "Kids club"],
        "starting_price": 300,
        "featured": True,
        "rooms": [
            {"name": "Deluxe Garden", "description": "Garden-view king room.", "capacity": 2, "price_per_night": 300, "amenities": ["Garden view", "King bed"], "images": ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80"]},
            {"name": "Pool Villa", "description": "Private pool villa with garden.", "capacity": 4, "price_per_night": 880, "amenities": ["Private pool", "Garden"], "images": ["https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80"]},
        ],
    },
    {
        "name": "D-Resort Göcek",
        "city": "Muğla",
        "region": "Göcek",
        "stars": 5,
        "description": "Marina-front boutique resort, ideal base for sailing the turquoise coast.",
        "cover_image": "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1600&q=80",
        "gallery": ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=80"],
        "amenities": ["Marina view", "Yacht tours", "Private pier"],
        "starting_price": 230,
        "featured": False,
        "rooms": [
            {"name": "Marina View Room", "description": "Modern room overlooking the marina.", "capacity": 2, "price_per_night": 230, "amenities": ["Marina view", "Balcony"], "images": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"]},
        ],
    },
    {
        "name": "Marmaris Bay Resort",
        "city": "Muğla",
        "region": "Marmaris",
        "stars": 5,
        "description": "Adults-only beachfront retreat on a private bay near Marmaris.",
        "cover_image": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80",
        "gallery": ["https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80"],
        "amenities": ["Adults only", "Beachfront", "Spa", "All inclusive"],
        "starting_price": 240,
        "featured": False,
        "rooms": [
            {"name": "Sea View Standard", "description": "Bright room with sea view balcony.", "capacity": 2, "price_per_night": 240, "amenities": ["Sea view", "Balcony"], "images": ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80"]},
            {"name": "Honeymoon Suite", "description": "Romantic suite with jacuzzi.", "capacity": 2, "price_per_night": 520, "amenities": ["Jacuzzi", "Sea view"], "images": ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"]},
        ],
    },
    {
        "name": "Titanic Deluxe Lara",
        "city": "Antalya",
        "region": "Lara",
        "stars": 5,
        "description": "Iconic ship-shaped resort with vast pools and water slides on Lara beach.",
        "cover_image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80",
        "gallery": ["https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1400&q=80"],
        "amenities": ["Beachfront", "Waterpark", "All inclusive", "Spa"],
        "starting_price": 210,
        "featured": False,
        "rooms": [
            {"name": "Standard Land View", "description": "Comfortable room with garden view.", "capacity": 2, "price_per_night": 210, "amenities": ["Garden view"], "images": ["https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80"]},
            {"name": "Family Sea View", "description": "Spacious family room overlooking the sea.", "capacity": 4, "price_per_night": 380, "amenities": ["Sea view", "Family"], "images": ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80"]},
        ],
    },
]


SEED_REVIEWS = [
    {"name": "Layla K.", "country": "Dubai, UAE", "rating": 5, "text": "Reem arranged everything from hotel upgrades to a private guide. The smoothest trip we've ever had — worth every euro.", "approved": True},
    {"name": "Daniel M.", "country": "London, UK", "rating": 5, "text": "Group of nine, not a single hiccup. The Sprinter and driver were spotless. We'll book through Reem again.", "approved": True},
    {"name": "Ayşe T.", "country": "Ankara, TR", "rating": 5, "text": "Detaylara verdikleri özen inanılmaz. Türkiye'yi yeniden keşfettim. Kesinlikle tavsiye ederim.", "approved": True},
    {"name": "Omar F.", "country": "Riyadh, KSA", "rating": 5, "text": "Booked Maxx Royal Belek through Reem at a much better rate than online. Transfer included, very professional.", "approved": True},
]


async def seed_hotels_and_reviews():
    if await db.hotels.count_documents({}) == 0:
        for h in SEED_HOTELS:
            rooms = [Room(**r).model_dump() for r in h.get("rooms", [])]
            hotel_data = {k: v for k, v in h.items() if k != "rooms"}
            hotel = Hotel(**hotel_data, rooms=rooms)
            doc = hotel.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.hotels.insert_one(doc)
        logger.info(f"Seeded {len(SEED_HOTELS)} hotels")

    if await db.reviews.count_documents({}) == 0:
        for r in SEED_REVIEWS:
            review = Review(**r)
            doc = review.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.reviews.insert_one(doc)
        logger.info(f"Seeded {len(SEED_REVIEWS)} reviews")


@app.on_event("startup")
async def on_startup():
    await db.admins.create_index("email", unique=True)
    await db.hotels.create_index("id", unique=True)
    await db.reviews.create_index("approved")
    await seed_admin()
    await seed_hotels_and_reviews()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ----------------------------------------------------------------------------
# CORS + router
# ----------------------------------------------------------------------------
app.include_router(api)
cors_origins = [origin.strip() for origin in required_env("CORS_ORIGINS").split(",") if origin.strip()]
if not cors_origins or "*" in cors_origins:
    raise RuntimeError("CORS_ORIGINS must contain one or more explicit origins")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)




if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
