# ARCHON Compact Federation - OPA Policy Rules
# Version: 2.5.1
# Purpose: Security, risk control, and authorization policies

package archon.policy

import future.keywords.if
import future.keywords.in

# ================================
# DEFAULT RULES
# ================================

default allow = false
default deploy_allowed = false
default build_allowed = false

# ================================
# TRUST-BASED AUTHORIZATION
# ================================

# Allow action if trust score meets threshold
allow if {
    input.trust_score >= 0.7
    input.plan_approved == true
    not contains_forbidden_content(input.plan)
}

# Allow build if supervisor approved
build_allowed if {
    input.supervisor_approved == true
    input.trust_score >= 0.7
    input.cohesion_score >= 0.6
    valid_ai_source(input.source)
}

# Allow deployment if all checks pass
deploy_allowed if {
    build_allowed
    input.tests_passed == true
    input.security_scan_passed == true
    not in_cooldown(input.last_deploy_time)
}

# ================================
# AI SOURCE VALIDATION
# ================================

valid_ai_sources := {"gpt4o", "gpt5", "claude", "gemini", "deepseek", "supervisor"}

valid_ai_source(source) if {
    source in valid_ai_sources
}

# ================================
# CONTENT SECURITY
# ================================

forbidden_patterns := [
    "rm -rf /",
    "DROP TABLE",
    "DELETE FROM",
    "eval(",
    "exec(",
    "__import__",
    "subprocess.call",
    "os.system",
    "curl | bash",
    "wget | sh"
]

contains_forbidden_content(plan) if {
    some pattern in forbidden_patterns
    contains(lower(plan.code), lower(pattern))
}

contains_forbidden_content(plan) if {
    some pattern in forbidden_patterns
    contains(lower(plan.command), lower(pattern))
}

# ================================
# RATE LIMITING
# ================================

# Cooldown period in seconds (5 minutes)
cooldown_period := 300

in_cooldown(last_time) if {
    current_time := time.now_ns() / 1000000000
    elapsed := current_time - last_time
    elapsed < cooldown_period
}

# ================================
# COST CONTROL
# ================================

max_token_cost_per_build := 5.0  # USD
max_daily_builds := 50
max_daily_deploys := 20

cost_within_limits if {
    input.estimated_cost <= max_token_cost_per_build
}

builds_within_limit if {
    input.daily_build_count < max_daily_builds
}

deploys_within_limit if {
    input.daily_deploy_count < max_daily_deploys
}

# ================================
# ENVIRONMENT PROTECTION
# ================================

protected_environments := {"production", "prod", "main"}

production_deploy_allowed if {
    deploy_allowed
    input.trust_score >= 0.85  # Higher threshold for production
    input.manual_approval == true
}

staging_deploy_allowed if {
    deploy_allowed
    input.environment == "staging"
}

# ================================
# AUDIT LOGGING
# ================================

audit_required if {
    input.action in {"deploy", "delete", "modify_config", "update_weights"}
}

audit_log := {
    "timestamp": time.now_ns(),
    "action": input.action,
    "source": input.source,
    "trust_score": input.trust_score,
    "allowed": allow,
    "reason": deny_reason
}

# ================================
# DENY REASONS
# ================================

deny_reason := "Trust score below threshold" if {
    input.trust_score < 0.7
}

deny_reason := "Plan not approved by supervisor" if {
    input.plan_approved != true
}

deny_reason := "Forbidden content detected" if {
    contains_forbidden_content(input.plan)
}

deny_reason := "Invalid AI source" if {
    not valid_ai_source(input.source)
}

deny_reason := "Cost exceeds limit" if {
    not cost_within_limits
}

deny_reason := "In cooldown period" if {
    in_cooldown(input.last_deploy_time)
}

# ================================
# EMERGENCY OVERRIDE
# ================================

# Only for critical recovery scenarios
emergency_override_allowed if {
    input.emergency_key_valid == true
    input.source == "supervisor"
    input.reason in {"critical_fix", "security_patch", "rollback"}
}

# ================================
# HELPER FUNCTIONS
# ================================

# Check if string contains substring (case-insensitive)
contains(str, substr) if {
    indexof(str, substr) >= 0
}

lower(s) = output if {
    output := lower(s)
}
