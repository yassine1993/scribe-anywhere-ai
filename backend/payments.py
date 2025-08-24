import stripe
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from . import models, auth
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("payments")

stripe.api_key = settings.stripe_secret_key
router = APIRouter(prefix="/stripe", tags=["stripe"])

# Stripe price ID for $10/month subscription (you'll need to create this in your Stripe dashboard)
SUBSCRIPTION_PRICE_ID = "price_1234567890"  # Replace with your actual price ID

@router.post("/create-checkout-session")
async def create_checkout_session(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe checkout session for subscription"""
    try:
        # Check if user already has an active subscription
        if current_user.is_paid:
            raise HTTPException(status_code=400, detail="User already has an active subscription")
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            customer_email=current_user.email,
            line_items=[{
                "price": SUBSCRIPTION_PRICE_ID,
                "quantity": 1,
            }],
            mode="subscription",
            success_url="http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:5173/cancel",
            metadata={
                "user_id": str(current_user.id),
                "email": current_user.email
            }
        )
        
        logger.info(f"Created checkout session {session.id} for user {current_user.email}")
        return {"sessionId": session.id, "url": session.url}
        
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhooks for subscription events"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        # Verify webhook signature (you'll need to set this in your Stripe dashboard)
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await handle_checkout_completed(session, db)
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        await handle_subscription_deleted(subscription, db)
    elif event["type"] == "invoice.payment_failed":
        invoice = event["data"]["object"]
        await handle_payment_failed(invoice, db)
    
    return {"status": "success"}

async def handle_checkout_completed(session: dict, db: Session):
    """Handle successful checkout completion"""
    try:
        user_id = int(session["metadata"]["user_id"])
        user = db.query(models.User).filter(models.User.id == user_id).first()
        
        if user:
            user.is_paid = True
            db.commit()
            logger.info(f"User {user.email} subscription activated")
        else:
            logger.error(f"User {user_id} not found for subscription activation")
            
    except Exception as e:
        logger.error(f"Error handling checkout completion: {e}")

async def handle_subscription_deleted(subscription: dict, db: Session):
    """Handle subscription cancellation"""
    try:
        customer_email = subscription.get("customer_email")
        if customer_email:
            user = db.query(models.User).filter(models.User.email == customer_email).first()
            if user:
                user.is_paid = False
                db.commit()
                logger.info(f"User {user.email} subscription cancelled")
                
    except Exception as e:
        logger.error(f"Error handling subscription deletion: {e}")

async def handle_payment_failed(invoice: dict, db: Session):
    """Handle failed payment"""
    try:
        customer_email = invoice.get("customer_email")
        if customer_email:
            user = db.query(models.User).filter(models.User.email == customer_email).first()
            if user:
                # You might want to send an email notification here
                logger.warning(f"Payment failed for user {user.email}")
                
    except Exception as e:
        logger.error(f"Error handling payment failure: {e}")

@router.get("/subscription-status")
async def get_subscription_status(
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get current subscription status"""
    return {
        "is_paid": current_user.is_paid,
        "usage_count": current_user.usage_count,
        "plan": "unlimited" if current_user.is_paid else "free",
        "limits": {
            "free": {"daily_uploads": 3, "max_file_size": "5GB"},
            "unlimited": {"daily_uploads": "unlimited", "max_file_size": "5GB"}
        }
    }

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription"""
    if not current_user.is_paid:
        raise HTTPException(status_code=400, detail="No active subscription to cancel")
    
    try:
        # You would typically cancel the subscription in Stripe here
        # For now, we'll just update the local database
        current_user.is_paid = False
        db.commit()
        
        logger.info(f"User {current_user.email} subscription cancelled")
        return {"message": "Subscription cancelled successfully"}
        
    except Exception as e:
        logger.error(f"Error cancelling subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")
