import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import asyncio
from app.bastion_helper import BastionManager
from app.db_client.models.ssh_management import System

class TestSSHBridge(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.mock_websocket = AsyncMock()
        self.mock_system = System(
            id=1,
            name="Test System",
            ip_address="127.0.0.1",
            username="testuser",
            password="testpassword"
        )
        self.mock_audit_logger = AsyncMock()

    @patch('paramiko.SSHClient')
    async def test_handle_ssh_session_flow(self, mock_ssh_client_class):
        """Verify that handle_ssh_session connects and bridges data"""
        mock_ssh = mock_ssh_client_class.return_value
        mock_channel = MagicMock()
        mock_ssh.invoke_shell.return_value = mock_channel
        
        # Mock channel data availability
        mock_channel.recv_ready.side_effect = [True, False, False]
        mock_channel.recv.return_value = b"welcome to terminal"
        
        # Mock websocket messages
        self.mock_websocket.receive_text.side_effect = ["ls\n", Exception("exit loop")]

        try:
            await BastionManager.handle_ssh_session(self.mock_websocket, self.mock_system, self.mock_audit_logger)
        except Exception as e:
            if str(e) != "exit loop":
                raise e

        # Assertions
        mock_ssh.connect.assert_called_with(
            "127.0.0.1", 
            username="testuser", 
            password="testpassword", 
            timeout=10
        )
        mock_ssh.invoke_shell.assert_called()
        self.mock_websocket.send_text.assert_any_call("welcome to terminal")
        self.mock_audit_logger.log_keystroke.assert_called()

if __name__ == '__main__':
    unittest.main()
