import copy
import json
import unittest
import mock

from server.WSVoiceProtocol import WSVoiceProtocol, user_list, message_router
from server.WSVoiceServerFactory import WSVoiceServerFactory
from server.WSUser import WSUser


class TestWSVoiceProtocol(unittest.TestCase):
    def setUp(self):
        self.protocol = WSVoiceProtocol()
        self.users_payload_template = {
            'type': 'users',
            'payload': {
                'users': {}
            }
        }

    def test_user_list_with_empty_user_list(self):
        expected = json.dumps(self.users_payload_template)
        result = user_list(None, {})
        self.assertEqual(expected, result)

    def test_user_list_with_only_1_user(self):
        expected = json.dumps(self.users_payload_template)
        test_user = WSUser(1, 'test')
        users = {
            '1': test_user
        }
        result = user_list('1', users)

        self.assertEqual(expected, result)

    def test_user_list_with_2_users(self):
        test_user = WSUser(1, 'test')
        test_user_2 = WSUser(2, 'test2')
        users = {
            '1': test_user,
            '2': test_user_2
        }

        template = copy.deepcopy(self.users_payload_template)
        template['payload']['users']['2'] = 'test2'

        expected = json.dumps(template)
        result = user_list('1', users)
        self.assertEqual(expected, result)

    def test_message_router_maps_to_callables(self):
        for key, value in message_router.iteritems():
            self.assertTrue(callable(value))
