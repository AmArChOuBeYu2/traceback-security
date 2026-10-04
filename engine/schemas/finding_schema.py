from typing import List, Optional
from pydantic import BaseModel, Field


class Finding(BaseModel):
    id: str = Field(..., description="Unique finding ID (e.g. FND-0001)")
    rule: str = Field(..., description="Rule identifier (e.g. RULE-PASSWORD-SPRAY)")
    rule_name: str = Field(..., description="Human-readable rule name")
    entity_type: str = Field(..., description="Target entity type: IP, USER, HOST")
    entity: str = Field(..., description="Target entity identifier (e.g. 198.51.100.42, sysadmin)")
    severity: str = Field(..., description="Severity level: LOW, MEDIUM, HIGH, CRITICAL")
    stage: str = Field(..., description="MITRE ATT&CK stage or tactic name")
    event_ids: List[str] = Field(..., description="List of raw event IDs proving this finding")
    detail: str = Field(..., description="Detailed narrative explanation of the finding")
