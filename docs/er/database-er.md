erDiagram
    Department ||--o{ User : "1:N"
    Department ||--o{ Department : "parent"
    Department ||--o{ Project : "1:N"

    User ||--o{ UserRole : "N:M"
    Role ||--o{ UserRole : "N:M"
    Role ||--o{ RolePermission : "N:M"
    Permission ||--o{ RolePermission : "N:M"

    User ||--o{ Project : "owns (owner)"
    User ||--o{ ProjectMember : "joins"
    Project ||--o{ ProjectMember : "has"

    Project ||--o| ProjectApplication : "1:1"
    ProjectApplication ||--o{ ProjectApproval : "1:N"

    Project ||--o{ Task : "has (WBS)"
    Task ||--o{ Task : "parent (WBS)"
    Task ||--o{ TaskDependency : "depends"
    Task ||--o{ Subtask : "1:N"
    Task ||--o| Milestone : "1:1"

    Subtask ||--o{ SubtaskUpload : "1:N"
    Subtask ||--o{ SubtaskReview : "1:N"

    Project ||--o{ Document : "1:N"
    Document ||--o{ DocumentVersion : "1:N"
    Document ||--o{ DocumentPermission : "1:N"
    Document ||--o{ Document : "parent (folder)"

    Project ||--o{ Risk : "1:N"
    Project ||--o{ Issue : "1:N"
    Issue ||--o{ IssueComment : "1:N"

    Project ||--o{ BudgetItem : "1:N"
    BudgetItem ||--o{ ActualCost : "1:N"

    Project ||--o{ ProjectClosure : "1:1"
    Project ||--o{ LessonLearned : "1:N"

    User ||--o{ Notification : "1:N"
    User ||--o{ AuditLog : "1:N"
    User ||--o{ ProjectLog : "1:N"

    Attachment ||--o{ DocumentVersion : "1:1"
    Attachment ||--o{ SubtaskUpload : "1:1"

    NumberSequence ||--|| NumberSequence : "by year/dept"

    style Project fill:#2563eb,color:#fff
    style Subtask fill:#f59e0b,color:#fff
    style User fill:#10b981,color:#fff
```
