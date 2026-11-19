from .extensions import db
from .models import Notification


def notify(user_id, title, body="", tone="info", link=None):
    """Queue an in-app notification (delivered to the browser by polling + Notification API)."""
    if user_id:
        db.session.add(Notification(user_id=user_id, title=title[:120], body=body[:300], tone=tone, link=link))
