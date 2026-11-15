const { body, param, validationResult } = require('express-validator');
const { isTmdbId } = require('../utils/tmdbId');

exports.validateCollection = [
  body('name').trim().notEmpty().withMessage('Collection name is required.'),
];

const optionalNotes = () =>
  body('notes')
    .custom((value) => value == null || typeof value === 'string')
    .withMessage('notes must be a string.')
    .customSanitizer((value) => (typeof value === 'string' ? value.trim() : value));

const titleIdParam = (name) =>
  param(name).custom(isTmdbId).withMessage('Title id must be a positive integer.');

exports.validateMovieToCollection = [
  body('is_tv_show')
    .custom((value) => typeof value === 'boolean')
    .withMessage('is_tv_show is required and must be boolean.'),
  body('movie_id')
    .if((value, { req }) => req.body.is_tv_show === false)
    .exists({ values: 'falsy' })
    .withMessage('movie_id is required when is_tv_show is false')
    .bail()
    .custom(isTmdbId)
    .withMessage('movie_id must be a positive integer.'),
  body('tv_show_id')
    .if((value, { req }) => req.body.is_tv_show === true)
    .exists({ values: 'falsy' })
    .withMessage('tv_show_id is required when is_tv_show is true')
    .bail()
    .custom(isTmdbId)
    .withMessage('tv_show_id must be a positive integer.'),
  body('title').trim().notEmpty().withMessage('title is required.'),
  body('poster_path')
    .custom((value) => value == null || typeof value === 'string')
    .withMessage('poster path must be a string.')
    .customSanitizer((value) =>
      typeof value === 'string' ? value.trim() || null : value == null ? null : value,
    ),
  optionalNotes(),
  body('rating')
    .custom(
      (value) =>
        value == null ||
        (typeof value === 'number' && value >= 0 && value <= 10) ||
        (typeof value === 'string' && /^\d{1,2}(\.\d+)?$/.test(value) && Number(value) <= 10),
    )
    .withMessage('rating must be a number from 0 to 10.'),
  body('rating_count')
    .custom(
      (value) => value == null || (Number.isInteger(value) && value >= 0 && value <= 2147483647),
    )
    .withMessage('rating_count must be a non-negative integer.'),
  body('release_date')
    .custom(
      (value) =>
        value == null ||
        (typeof value === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !Number.isNaN(Date.parse(value)) &&
          new Date(value).toISOString().startsWith(value)),
    )
    .withMessage('release_date must be a YYYY-MM-DD date.'),
];

exports.validateMovieCollectionNotes = [
  body('is_tv_show')
    .custom((value) => typeof value === 'boolean')
    .withMessage('is_tv_show is required and must be boolean.'),
  optionalNotes(),
  titleIdParam('movie_id'),
];

exports.validateCheckExist = [titleIdParam('movie_or_tv_show_id')];

exports.validateRemoveMovie = [titleIdParam('movie_id')];

exports.firstValidationError = (req) => validationResult(req).array()[0]?.msg;
