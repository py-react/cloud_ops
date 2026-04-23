import unittest
import asyncio
from unittest.mock import MagicMock, patch
from app.utils.audit_logger import AuditLogger

class TestAuditLogger(unittest.TestCase):
    def setUp(self):
        self.session_id = "test-session-123"
        self.system_id = 1
        self.user_id = "user1"

    @patch('app.utils.audit_logger.get_session')
    def test_log_keystroke_buffering(self, mock_get_session):
        """Verify that keystrokes are buffered before flushing"""
        logger = AuditLogger(self.session_id, self.system_id, self.user_id)
        
        # We need a loop for async calls
        loop = asyncio.get_event_loop()
        
        # Log 5 keystrokes (buffer limit is 50)
        for i in range(5):
            loop.run_until_complete(logger.log_keystroke('a'))
        
        self.assertEqual(len(logger._buffer), 5)
        # Flush should not have been called yet
        mock_get_session.assert_not_called()

    @patch('app.utils.audit_logger.get_session')
    def test_flush_logic(self, mock_get_session):
        """Verify that flushing saves data correctly"""
        logger = AuditLogger(self.session_id, self.system_id, self.user_id)
        logger._buffer = [{"t": "2026-04-08T18:00:00", "d": "h"}]
        
        # Correctly mock context manager with get_session() as db:
        mock_db = MagicMock()
        mock_get_session.return_value.__enter__.return_value = mock_db
        
        # Mocking the database query result
        mock_audit_entry = MagicMock()
        mock_audit_entry.keystroke_data = "[]"
        mock_db.exec.return_value.first.return_value = mock_audit_entry
        
        loop = asyncio.get_event_loop()
        loop.run_until_complete(logger.flush())
        
        # Verify the entry was updated
        self.assertIn('"d": "h"', mock_audit_entry.keystroke_data)
        self.assertEqual(len(logger._buffer), 0)
        mock_db.add.assert_called()
        mock_db.commit.assert_called()

if __name__ == '__main__':
    unittest.main()
