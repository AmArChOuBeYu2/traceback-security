from abc import ABC, abstractmethod
from typing import List
from schemas.event_schema import UnifiedEvent
from schemas.finding_schema import Finding


class BaseDetector(ABC):
    """
    Abstract Base Class for all TRACEBACK deterministic detectors.
    """

    @property
    @abstractmethod
    def rule_id(self) -> str:
        pass

    @property
    @abstractmethod
    def rule_name(self) -> str:
        pass

    @abstractmethod
    def detect(self, events: List[UnifiedEvent]) -> List[Finding]:
        pass
