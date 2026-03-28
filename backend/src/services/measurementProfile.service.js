'use strict';

const MeasurementProfile = require('../models/MeasurementProfile');

const MAX_PROFILES = 5;

const createProfile = async (userId, { name, measurements }) => {
  const count = await MeasurementProfile.countDocuments({ userId });
  if (count >= MAX_PROFILES) {
    const err = new Error(`Maximum of ${MAX_PROFILES} measurement profiles allowed.`);
    err.status = 400;
    throw err;
  }
  // If this is the first profile, make it default
  const isDefault = count === 0;
  return MeasurementProfile.create({ userId, name, measurements, isDefault });
};

const getProfiles = async (userId) =>
  MeasurementProfile.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

const updateProfile = async (userId, profileId, updates) => {
  // If setting as default, clear all others first
  if (updates.isDefault === true) {
    await MeasurementProfile.updateMany({ userId }, { isDefault: false });
  }
  const profile = await MeasurementProfile.findOneAndUpdate(
    { _id: profileId, userId },
    updates,
    { new: true }
  );
  if (!profile) {
    const err = new Error('Profile not found');
    err.status = 404;
    throw err;
  }
  return profile;
};

const deleteProfile = async (userId, profileId) => {
  const profile = await MeasurementProfile.findOneAndDelete({ _id: profileId, userId });
  if (!profile) {
    const err = new Error('Profile not found');
    err.status = 404;
    throw err;
  }
  // If deleted profile was default, set newest remaining as default
  if (profile.isDefault) {
    const next = await MeasurementProfile.findOne({ userId }).sort({ createdAt: -1 });
    if (next) { await MeasurementProfile.findByIdAndUpdate(next._id, { isDefault: true }); }
  }
  return profile;
};

module.exports = { createProfile, getProfiles, updateProfile, deleteProfile };
