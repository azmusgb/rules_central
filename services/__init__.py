"""
services package
"""

from .rule_processing_service import RuleProcessingService
from .audit_service import AuditService
from .validation_service import ValidationService
from .domain_service import DomainService

rule_service = RuleProcessingService()
audit_service = AuditService()
validation_service = ValidationService()
domain_service = DomainService()
