"""
LendSwift AI - Pages and General Routes Blueprint
Handles navigation, contact forms, and protected routes
"""

from flask import Blueprint, jsonify, request, render_template_string
from ..database import get_connection
from ..utils.validators import validate_email, validate_mobile
from ..utils.security import verify_jwt
from datetime import datetime
import logging

pages_bp = Blueprint("pages", __name__)
logger = logging.getLogger(__name__)


@pages_bp.route("/check-auth", methods=["GET"])
def check_auth():
    """Check if user is authenticated via JWT token"""
    try:
        token = request.cookies.get("lend_sft_token")
        if not token:
            return jsonify({"loggedIn": False}), 200

        payload = verify_jwt(token)
        if not payload:
            return jsonify({"loggedIn": False}), 200

        return jsonify({
            "loggedIn": True,
            "user": {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name"),
                "mobile": payload.get("mobile")
            }
        }), 200
    except Exception as e:
        logger.error(f"Auth check error: {str(e)}")
        return jsonify({"loggedIn": False}), 200


@pages_bp.route("/api/auth/status", methods=["GET"])
def auth_status():
    """Get authentication status (alias for /check-auth)"""
    try:
        token = request.cookies.get("lend_sft_token")
        if not token:
            return jsonify({"authenticated": False}), 200

        payload = verify_jwt(token)
        if not payload:
            return jsonify({"authenticated": False}), 200

        return jsonify({
            "authenticated": True,
            "user": {
                "sub": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name"),
                "mobile": payload.get("mobile")
            }
        }), 200
    except Exception as e:
        logger.error(f"Auth status error: {str(e)}")
        return jsonify({"authenticated": False}), 200


@pages_bp.route("/contact-message", methods=["POST"])
def contact_message():
    """Store contact form message in database"""
    try:
        payload = request.get_json(silent=True) or {}
        name = (payload.get("name") or "").strip()
        email = (payload.get("email") or "").strip()
        mobile = (payload.get("mobile") or "").strip()
        message = (payload.get("message") or "").strip()

        # Validation
        if not name or len(name) < 2:
            return jsonify({"error": "Please provide a valid name."}), 400

        if not validate_email(email):
            return jsonify({"error": "Please provide a valid email address."}), 400

        if not validate_mobile(mobile):
            return jsonify({"error": "Please provide a valid 10-digit mobile number."}), 400

        if not message or len(message) < 10:
            return jsonify({"error": "Message must be at least 10 characters long."}), 400

        # Store in database
        with get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO contact_messages 
                (name, email, mobile, message, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (name, email, mobile, message, datetime.utcnow().isoformat())
            )
            conn.commit()
            message_id = cursor.lastrowid

        logger.info(f"Contact message stored: ID {message_id}")
        return jsonify({
            "success": True,
            "message": "Thank you for contacting us! We'll get back to you soon.",
            "messageId": message_id
        }), 201

    except Exception as e:
        logger.error(f"Contact message error: {str(e)}")
        return jsonify({"error": "Failed to send message. Please try again."}), 500


@pages_bp.route("/apply-loan", methods=["GET"])
def apply_loan_page():
    """Protected route for loan application page"""
    try:
        token = request.cookies.get("lend_sft_token")
        if not token:
            return jsonify({
                "error": "Unauthorized",
                "message": "Please login to apply for a loan"
            }), 401

        payload = verify_jwt(token)
        if not payload:
            return jsonify({
                "error": "Unauthorized",
                "message": "Your session has expired"
            }), 401

        # User is authenticated, they can access the page
        return jsonify({
            "authorized": True,
            "user": {
                "id": payload.get("sub"),
                "name": payload.get("name")
            }
        }), 200

    except Exception as e:
        logger.error(f"Apply loan auth error: {str(e)}")
        return jsonify({
            "error": "Unauthorized",
            "message": "Authentication failed"
        }), 401


@pages_bp.route("/loan-application", methods=["POST"])
def submit_loan_application():
    """Submit loan application"""
    try:
        token = request.cookies.get("lend_sft_token")
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        payload = verify_jwt(token)
        if not payload:
            return jsonify({"error": "Unauthorized"}), 401

        user_id = payload.get("sub")
        application_data = request.get_json(silent=True) or {}

        # Validate application data
        required_fields = ["fullName", "loanType", "loanAmount", "monthlyIncome"]
        for field in required_fields:
            if not application_data.get(field):
                return jsonify({"error": f"{field} is required."}), 400

        # Store in database
        with get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO loan_applications 
                (user_id, loan_type, loan_amount, monthly_income, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    application_data.get("loanType"),
                    float(application_data.get("loanAmount", 0)),
                    float(application_data.get("monthlyIncome", 0)),
                    "submitted",
                    datetime.utcnow().isoformat()
                )
            )
            conn.commit()
            application_id = cursor.lastrowid

        logger.info(f"Loan application submitted: ID {application_id}, User {user_id}")
        return jsonify({
            "success": True,
            "message": "Loan application submitted successfully.",
            "applicationId": application_id,
            "status": "submitted"
        }), 201

    except Exception as e:
        logger.error(f"Loan application error: {str(e)}")
        return jsonify({"error": "Failed to submit application. Please try again."}), 500


@pages_bp.route("/get-application-status/<int:application_id>", methods=["GET"])
def get_application_status(application_id):
    """Get loan application status"""
    try:
        token = request.cookies.get("lend_sft_token")
        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        payload = verify_jwt(token)
        if not payload:
            return jsonify({"error": "Unauthorized"}), 401

        user_id = payload.get("sub")

        with get_connection() as conn:
            application = conn.execute(
                """
                SELECT id, user_id, loan_type, loan_amount, status, created_at
                FROM loan_applications
                WHERE id = ? AND user_id = ?
                """,
                (application_id, user_id)
            ).fetchone()

            if not application:
                return jsonify({"error": "Application not found."}), 404

            return jsonify({
                "id": application["id"],
                "loanType": application["loan_type"],
                "loanAmount": application["loan_amount"],
                "status": application["status"],
                "createdAt": application["created_at"]
            }), 200

    except Exception as e:
        logger.error(f"Get application status error: {str(e)}")
        return jsonify({"error": "Failed to retrieve status."}), 500
