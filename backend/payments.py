import stripe
from fastapi import APIRouter, HTTPException
from .config import settings

stripe.api_key = settings.stripe_secret_key
router = APIRouter(prefix="/stripe", tags=["stripe"])


@router.post("/create-checkout-session")
async def create_checkout_session():
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": "Scribe Anywhere Subscription"},
                    "unit_amount": 1000,
                },
                "quantity": 1,
            }],
            mode="subscription",
            success_url="http://localhost:8080/success",
            cancel_url="http://localhost:8080/cancel",
        )
        return {"sessionId": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
