"""
Priority Engine for CIVICSHIELD AI.
Derives dispatch priority score (0-100) and actionable operational tier
(CRITICAL, HIGH, MEDIUM, LOW) by fusing risk score and physical severity.
"""

from typing import Any, Dict, Optional, Union


# Priority Tiers
PRIORITY_TIER_CRITICAL = "CRITICAL"  # >= 80
PRIORITY_TIER_HIGH = "HIGH"          # 60 - 79
PRIORITY_TIER_MEDIUM = "MEDIUM"      # 40 - 59
PRIORITY_TIER_LOW = "LOW"            # 0 - 39


def get_priority_level(priority_score: int) -> str:
    """Map a 0-100 priority score to its municipal dispatch priority tier."""
    if priority_score >= 80:
        return PRIORITY_TIER_CRITICAL
    if priority_score >= 60:
        return PRIORITY_TIER_HIGH
    if priority_score >= 40:
        return PRIORITY_TIER_MEDIUM
    return PRIORITY_TIER_LOW


def calculate_priority(
    risk_score: Union[int, float],
    severity: Union[int, float],
    issue_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Compute operational resolution priority.

    FORMULA:
        Base_Priority = 0.65 * risk_score + 0.35 * (severity * 10)

        Acute Hazards Boost:
        - If severity >= 9 and risk_score >= 70: +10 points (critical structural hazard in active area)
        - If risk_score >= 85: +5 points (urgent environmental/contextual threat)

        Priority_Score = clamp(round(Adjusted_Priority), 0, 100)

    Args:
        risk_score: Overall risk score (0-100) from the risk engine.
        severity: Damage severity rating (0-10) from the severity engine.
        issue_type: Optional civic category name for context-aware reasons.

    Returns:
        Dictionary containing:
            - priority_score: Integer (0 - 100)
            - priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
            - priority_reason: Actionable municipal justification
    """
    r_val = max(0.0, min(100.0, float(risk_score)))
    s_val = max(0.0, min(10.0, float(severity)))

    # Weighted blend: 65% contextual risk + 35% physical severity
    base_priority = (0.65 * r_val) + (0.35 * (s_val * 10.0))

    # Acute danger boosts to ensure critical emergencies receive immediate dispatch
    boost = 0.0
    if s_val >= 9.0 and r_val >= 70.0:
        boost += 8.0
    elif r_val >= 85.0:
        boost += 5.0

    adjusted_priority = base_priority + boost
    final_score = max(0, min(100, int(round(adjusted_priority))))
    tier = get_priority_level(final_score)

    # Contextual operational reason
    type_str = f" for {issue_type}" if issue_type else ""
    if tier == PRIORITY_TIER_CRITICAL:
        reason = (
            f"Urgent critical hazard{type_str}: extreme public safety risk ({int(r_val)}/100) "
            f"and severe physical defect ({int(s_val)}/10) require emergency response within 2-4 hours."
        )
    elif tier == PRIORITY_TIER_HIGH:
        reason = (
            f"High priority defect{type_str}: elevated risk ({int(r_val)}/100) and substantial "
            f"damage ({int(s_val)}/10) require inspection and crew deployment within 24 hours."
        )
    elif tier == PRIORITY_TIER_MEDIUM:
        reason = (
            f"Moderate priority issue{type_str}: manageable risk profile ({int(r_val)}/100) "
            f"scheduled for standard municipal maintenance queue within 3-5 days."
        )
    else:
        reason = (
            f"Low priority report{type_str}: minimal public hazard ({int(r_val)}/100) logged "
            "for routine inspection cycle."
        )

    return {
        "priority_score": final_score,
        "priority_level": tier,
        "priority_reason": reason,
    }
