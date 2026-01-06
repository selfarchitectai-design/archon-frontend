# ARCHON Compact Federation - OPA Policy Rules
# Version: 1.0
# Purpose: Security and authorization policies for AI orchestration

package archon.policy

import future.keywords.if
import future.keywords.in

# ================================
# DEFAULT RULES
# ================================

default allow = false
default build_allowed = false
default deploy_allowed = false

# ================================
# TRUST-BASED AUTHORIZATION
# ================================

# Allow if trust score meets threshold
allow if {
    input.trust_score >= 0.7
    input.plan_approved == true
    not contains_unsafe_action(input.actions)
}

# Build is allowed if supervisor approved
build_allowed if {
    input.supervisor_approved == true
    input.trust_score >= 0.7
    input.cohesion_score >= 0.6
    valid_source(input.source)
}

# Deploy is allowed with additional checks
deploy_allowed if {
    build_allowed
    input.tests_passed == true
    input.deploy_target in ["production", "staging", "preview"]
}

# ================================
# SOURCE VALIDATION
# ================================

valid_source(source) if {
    source in ["GPT-5", "Claude", "Supervisor", "system", "GPT-4o"]
}

# ================================
# UNSAFE ACTION DETECTION
# ================================

contains_unsafe_action(actions) if {
    action := actions[_]
    unsafe_patterns[action]
}

unsafe_patterns := {
    "delete_all",
    "drop_database",
    "rm -rf /",
    "format_disk",
    "expose_secrets",
    "disable_security",
    "bypass_auth"
}

# ================================
# COST CONTROL
# ================================

cost_within_budget if {
    input.estimated_cost <= input.daily_budget
    input.token_usage <= input.max_tokens
}

# Deny if cost exceeds budget
deny[msg] if {
    input.estimated_cost > input.daily_budget
    msg := sprintf("Cost %v exceeds daily budget %v", [input.estimated_cost, input.daily_budget])
}

# ================================
# RATE LIMITING
# ================================

rate_limit_ok if {
    input.requests_per_minute <= 60
    input.builds_per_hour <= 10
}

deny[msg] if {
    input.requests_per_minute > 60
    msg := "Rate limit exceeded: too many requests per minute"
}

# ================================
# SECRET PROTECTION
# ================================

# Deny if plan contains secrets
deny[msg] if {
    contains(input.plan_content, "api_key")
    msg := "Plan contains sensitive key references"
}

deny[msg] if {
    contains(input.plan_content, "secret")
    contains(input.plan_content, "password")
    msg := "Plan contains sensitive credential references"
}

# ================================
# AI MODEL RESTRICTIONS
# ================================

# Only approved models can execute
model_allowed(model) if {
    model in ["gpt-4o", "gpt-5", "claude-sonnet-4-20250514", "gemini-2.0-flash", "deepseek-coder"]
}

deny[msg] if {
    not model_allowed(input.model)
    msg := sprintf("Model %v is not approved for use", [input.model])
}

# ================================
# BUILD PIPELINE RULES
# ================================

# Require tests before deploy
deny[msg] if {
    input.action == "deploy"
    input.tests_passed != true
    msg := "Cannot deploy without passing tests"
}

# Require supervisor approval for production
deny[msg] if {
    input.deploy_target == "production"
    input.supervisor_approved != true
    msg := "Production deploy requires supervisor approval"
}

# ================================
# AUDIT LOGGING
# ================================

audit_required if {
    input.action in ["deploy", "delete", "modify_config", "update_weights"]
}

# ================================
# EMERGENCY CONTROLS
# ================================

# Emergency stop - blocks all actions
emergency_stop if {
    input.emergency_mode == true
}

deny[msg] if {
    emergency_stop
    msg := "System is in emergency stop mode - all actions blocked"
}

# ================================
# TRUST WEIGHT VALIDATION
# ================================

valid_trust_weights if {
    sum([w | w := input.ai_pool[_].trust_weight]) == 1.0
}

deny[msg] if {
    not valid_trust_weights
    msg := "AI pool trust weights must sum to 1.0"
}
