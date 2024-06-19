#!/bin/bash

CORRECT_NAME="Chase-42"
CORRECT_EMAIL="chaseofthecollins@gmail.com"

git filter-repo --commit-callback '
commit.author_name = b"'"$CORRECT_NAME"'"
commit.author_email = b"'"$CORRECT_EMAIL"'"
commit.committer_name = b"'"$CORRECT_NAME"'"
commit.committer_email = b"'"$CORRECT_EMAIL"'"
' --force

