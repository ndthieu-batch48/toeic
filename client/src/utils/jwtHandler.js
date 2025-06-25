import { jwtDecode } from 'jwt-decode';

import { logAuthError } from './logger';

/**
 * Decode JWT token safely
 * @param {string} token - JWT token to decode
 * @returns {object|null} Decoded token or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    return jwtDecode(token);
  } catch (error) {
    logAuthError('JWT Decode', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  return decoded.exp < Date.now() / 1000;
};

/**
 * Get token expiration time in milliseconds
 * @param {string} token - JWT token
 * @returns {number|null} Expiration time in ms or null if invalid
 */
export const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  return decoded?.exp ? decoded.exp * 1000 : null;
};

/**
 * Check if token will expire within specified minutes
 * @param {string} token - JWT token
 * @param {number} minutes - Minutes threshold (default: 5)
 * @returns {boolean} True if token expires soon
 */
export const isTokenExpiringSoon = (token, minutes = 5) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;

  const expirationTime = decoded.exp * 1000;
  const thresholdTime = Date.now() + minutes * 60 * 1000;

  return expirationTime <= thresholdTime;
};

/**
 * Validate token structure and required fields
 * @param {string} token - JWT token
 * @param {string[]} requiredFields - Required fields in token payload
 * @returns {boolean} True if token is valid
 */
export const validateToken = (token, requiredFields = ['exp']) => {
  const decoded = decodeToken(token);
  if (!decoded) return false;

  return requiredFields.every((field) => Object.prototype.hasOwnProperty.call(decoded, field));
};
