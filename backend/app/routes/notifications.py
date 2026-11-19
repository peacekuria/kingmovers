from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models import Notification
from ..auth_utils import roles_required

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@bp.get("")
@roles_required()
def list_notifications(user):
    rows = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).limit(50).all()
    unread = Notification.query.filter_by(user_id=user.id, read=False).count()
    return jsonify(notifications=[n.to_dict() for n in rows], unread=unread)


@bp.post("/read")
@roles_required()
def mark_read(user):
    ids = (request.get_json(silent=True) or {}).get("ids")
    q = Notification.query.filter_by(user_id=user.id, read=False)
    if isinstance(ids, list):
        q = q.filter(Notification.id.in_([int(i) for i in ids if str(i).isdigit()]))
    q.update({"read": True}, synchronize_session=False)
    db.session.commit()
    return jsonify(ok=True)
