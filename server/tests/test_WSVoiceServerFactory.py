import unittest
import mock

from server.WSVoiceServerFactory import WSVoiceServerFactory
from server.WSUser import WSUser


class TestWSVoiceServerFactory(unittest.TestCase):
    def setUp(self):
        self.factory = WSVoiceServerFactory()

    def tearDown(self):
        del self.factory

    def compare_users(self, expected):
        self.assertEqual(expected.keys(), self.factory.users.keys())
        for key in expected:
            self.assertEqual(expected[key].__dict__, self.factory.users[key].__dict__)

    def test_add_user_with_no_users(self):
        self.factory.add_user('1', 'test_user')
        test_user = WSUser(1, 'test_user')
        expected = {'1': test_user}

        self.compare_users(expected)

    def test_factory_initializes_with_empty_user_list(self):
        self.assertEqual(self.factory.users.keys(), [])

    def test_factory_can_remove_users(self):
        test_user = WSUser(1, 'test_user')
        self.factory.users = {'1': test_user}
        self.factory.remove_user('1')
        expected = {}
        self.compare_users(expected)

    def test_factory_increments_id_when_adding_user(self):
        self.factory.add_user('1', 'test_user')
        self.assertEqual(self.factory.id_counter, 2)  # incremented from 1 to 2
