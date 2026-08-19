using System;
using System.Security.Cryptography;

namespace LuminaryLabs.UniMap
{
    public static class UniMapAuthentication
    {
        public static string CreateSessionToken()
        {
            byte[] bytes = new byte[16];
            using (RandomNumberGenerator generator = RandomNumberGenerator.Create())
            {
                generator.GetBytes(bytes);
            }

            return BitConverter.ToString(bytes).Replace("-", string.Empty).ToLowerInvariant();
        }

        public static bool IsAuthorized(UniMapRequest request, string expectedToken)
        {
            if (request == null || string.IsNullOrEmpty(expectedToken))
            {
                return false;
            }

            if (!request.TryGetHeader("Authorization", out string authorization))
            {
                return false;
            }

            const string prefix = "Bearer ";
            if (!authorization.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            string suppliedToken = authorization.Substring(prefix.Length).Trim();
            return FixedTimeEquals(suppliedToken, expectedToken);
        }

        private static bool FixedTimeEquals(string left, string right)
        {
            if (left == null || right == null || left.Length != right.Length)
            {
                return false;
            }

            int difference = 0;
            for (int index = 0; index < left.Length; index++)
            {
                difference |= left[index] ^ right[index];
            }

            return difference == 0;
        }
    }
}
