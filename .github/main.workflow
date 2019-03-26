workflow "Release" {
  on = "release"
  resolves = ["GitHub Action for Slack"]
}

workflow "New workflow 1" {
  on = "push"
}

action "GitHub Action for Slack" {
  uses = "Ilshidur/action-slack@4f4215e15353edafdc6d9933c71799e3eb4db61c"
  secrets = ["SLACK_WEBHOOK"]
}

