from flask import Blueprint

employee_bp = Blueprint("employee", __name__)


@employee_bp.route("/")
def home():
    return {
        "message": "Employee Management System Backend is running!"
    }