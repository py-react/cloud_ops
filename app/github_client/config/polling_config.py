import logging
from render_relay.utils.load_settings import load_settings

logger = logging.getLogger(__name__)

def get_polling_config():
    """Read PAT-based polling configuration from environment.

    Returns a dict with keys:
      - `pat`: the personal access token (or None)
      - `enabled`: bool whether polling is enabled (env `SCM_POLLING_ENABLED`)
      - `interval_seconds`: poll interval as int (env `SCM_POLL_INTERVAL_SECONDS`)
    """
    settings = load_settings()
    pat = settings.get('GITHUB_PAT')
    enabled = settings.get('SCM_POLLING_ENABLED', 'false').lower() in ('1', 'true', 'yes')
    try:
        interval = int(settings.get('SCM_POLL_INTERVAL_SECONDS', '300'))
    except ValueError:
        interval = 300
    return {"pat": pat, "enabled": enabled, "interval_seconds": interval}