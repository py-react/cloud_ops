
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class KubeconfigUser(BaseModel):
    name: str
    user: Dict[str, Any]


class RBACRoleSpec(BaseModel):
    name: str
    namespace: Optional[str] = Field(
        None, description="If omitted, we treat as a ClusterRole"
    )
    rules: List[Dict[str, Any]]  # each rule: {apiGroups, resources, verbs}


class RBACBindingSpec(BaseModel):
    name: str
    namespace: Optional[str] = Field(
        None, description="If omitted, we treat as a ClusterRoleBinding"
    )
    subjects: List[Dict[str, Any]]  # each subject: {kind, name, namespace?, apiGroup?}
    role_ref: Dict[str, Any]        # {kind, name, apiGroup}
