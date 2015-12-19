import unittest
import mock

from server.server import handle_args


class ServerTest(unittest.TestCase):
    def test_handle_args_with_h(self):
        arg_list = ['SCRIPT NAME GOES HERE', '-h']
        self.assertRaises(Exception, handle_args, arg_list)

    def test_handle_args_with_help(self):
        arg_list = ['SCRIPT NAME GOES HERE', '--help']
        self.assertRaises(Exception, handle_args, arg_list)

    def test_handle_args_with_empty_args(self):
        arg_list = ['SCRIPT NAME GOES HERE']
        expected = 80
        result = handle_args(arg_list)
        self.assertEqual(expected, result)

    def test_handle_args_with_port_number(self):
        arg_list = ['SCRIPT NAME GOES HERE', '8080']
        expected = 8080
        result = handle_args(arg_list)
        self.assertEqual(expected, result)

    def test_handle_args_with_invalid_port(self):
        arg_list = ['SCRIPT NAME GOES HERE', '3.14159']
        self.assertRaises(ValueError, handle_args, arg_list)

    def test_handle_args_with_excessive_arguments(self):
        # should just ignore any additional args
        arg_list = ['SCRIPT NAME GOES HERE', '8080', 'SOME ADDITION ARGUMENT']
        expected = 8080
        result = handle_args(arg_list)
        self.assertEqual(expected, result)