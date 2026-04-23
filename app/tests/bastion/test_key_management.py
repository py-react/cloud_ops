import unittest
from app.bastion_helper import BastionManager

class TestKeyManagement(unittest.TestCase):
    def test_key_pair_generation(self):
        """Verify that we can generate a valid RSA key pair"""
        private_key, public_key = BastionManager.generate_key_pair()
        
        self.assertTrue(private_key.startswith('-----BEGIN RSA PRIVATE KEY-----'))
        self.assertTrue(public_key.startswith('ssh-rsa '))
        self.assertIn(' ', public_key)
        
    def test_public_key_format(self):
        """Verify the public key format is correct for OpenSSH"""
        _, public_key = BastionManager.generate_key_pair()
        parts = public_key.split(' ')
        self.assertEqual(len(parts), 2)
        self.assertEqual(parts[0], 'ssh-rsa')
        # Check if it's base64 encoded
        import base64
        try:
            base64.b64decode(parts[1])
        except Exception:
            self.fail("Public key part is not valid base64")

if __name__ == '__main__':
    unittest.main()
