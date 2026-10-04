from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class UnifiedEvent(BaseModel):
    id: str = Field(..., description="Unique event identifier (e.g. EVT-0001)")
    ts: str = Field(..., description="ISO-8601 formatted timestamp string (e.g. 2026-10-04T14:00:00Z)")
    user: Optional[str] = Field(None, description="Username or principal associated with the event")
    src_ip: Optional[str] = Field(None, description="Source IPv4 address")
    host: Optional[str] = Field(None, description="Target host or server hostname")
    action: str = Field(..., description="Event action (e.g. LOGIN, SUDO, FILE_ACCESS, EXFILTRATE, CONNECT)")
    outcome: str = Field(..., description="Outcome status: SUCCESS, FAILURE, DENIED, ALLOWED")
    resource: Optional[str] = Field(None, description="Target file path, URL, database name, or port")
    bytes_out: int = Field(0, description="Outbound data volume in bytes")
    country: Optional[str] = Field(None, description="GeoIP country code (e.g. US, RU, CN, DE)")
    raw: str = Field(..., description="Original raw log line text")
    line_no: int = Field(..., description="Sequential log line number starting from 1")

    # Ground truth metadata attached to generated events
    is_attack: bool = Field(False, description="Flag indicating if event is part of an attack chain")
    attack_stage: Optional[str] = Field(None, description="MITRE ATT&CK stage name if is_attack is True")
    is_decoy: bool = Field(False, description="Flag indicating if event is a intentional decoy anomaly")
    decoy_type: Optional[str] = Field(None, description="Decoy classification type if is_decoy is True")

    def to_pandas_dict(self) -> Dict[str, Any]:
        """Converts model to dictionary suitable for pandas DataFrame construction."""
        return self.model_dump()
