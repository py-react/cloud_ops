"""
Constants for GitHub App message templates.
"""

# Welcome message templates
WELCOME_MESSAGES = {
    "first_pr": """
🎉 **Welcome @{username}!** 🎉

This is your first pull request to this repository! We're excited to have you contribute.

**What happens next:**
- Our team will review your code
- We may request some changes (this is normal!)
- Once approved, your PR will be merged

Thanks for contributing! 🚀
""",
    
    "returning_contributor": "Welcome back @{username}! Thanks for another great contribution! 🙌"
}

# Build status message templates
BUILD_MESSAGES = {
    "build_started": """
🔄 **Build Started**

@{username}, your build is now in progress! 

**Check Status:**
- [Check Status]({check_status_url})

**What's happening:**
- Cloning your branch
- Building Docker image from Dockerfile
- Running container for testing

This usually takes 2-5 minutes. We'll notify you when it's complete!

""",
    
    "build_success": """
✅ **Build Successful!**

@{username}, your Docker image has been built successfully!

**Image Details:**
- **Image Name:** `{image_name}`
- **Status:** Ready to use

The image is tagged and ready for deployment or testing.
""",
    
    "build_failure": """
❌ **Build Failed**

@{username}, your build encountered an issue.

**Error:** {error_message}

Please check that your branch contains a valid Dockerfile and try again.
"""
} 