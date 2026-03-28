'use strict';

const service = require('../services/measurementProfile.service');

async function createProfileHandler(req, res, next) {
  try {
    const profile = await service.createProfile(req.user.userId, req.body);
    return res.status(201).json({ status: 'success', data: { profile } });
  } catch (err) {
    return next(err);
  }
}

async function getProfilesHandler(req, res, next) {
  try {
    const profiles = await service.getProfiles(req.user.userId);
    return res.status(200).json({ status: 'success', data: { profiles } });
  } catch (err) {
    return next(err);
  }
}

async function updateProfileHandler(req, res, next) {
  try {
    const profile = await service.updateProfile(req.user.userId, req.params.id, req.body);
    return res.status(200).json({ status: 'success', data: { profile } });
  } catch (err) {
    return next(err);
  }
}

async function deleteProfileHandler(req, res, next) {
  try {
    await service.deleteProfile(req.user.userId, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createProfileHandler,
  getProfilesHandler,
  updateProfileHandler,
  deleteProfileHandler,
};
