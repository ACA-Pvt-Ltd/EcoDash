/**
 * Shared rules for the mobile app's Edit Profile (users, collectors, vendors).
 * Only fields present in the request are changed, the address is updated
 * field by field so a partial address never wipes the rest, and bad input
 * comes back as a 400 with a readable message.
 */
const WASTE_TYPES = ['E-waste', 'Plastic', 'Polythene', 'Glass', 'Paper', 'Metal', 'Organic'];
const BUSINESS_TYPES = ['Physical Store', 'Online', 'Both'];
const ADDRESS_FIELDS = ['street', 'city', 'state', 'zipCode'];
const MAX_TEXT = 500;

class ProfileInputError extends Error {}

const text = (value, field) => {
  if (value === null) return '';
  if (typeof value !== 'string') throw new ProfileInputError(`${field} must be text`);
  return value.trim().slice(0, MAX_TEXT);
};

/**
 * Builds a Mongo update for `body`, limited to `fields` (e.g. ['name','phone','address','description']).
 * Returns { $set, $unset }. Throws ProfileInputError for bad input.
 */
function buildProfileUpdate(body = {}, fields) {
  const $set = {};
  const $unset = {};
  const has = (key) => fields.includes(key) && body[key] !== undefined;

  if (has('name')) {
    const name = text(body.name, 'Name');
    if (!name) throw new ProfileInputError("Name can't be empty");
    $set.name = name;
  }
  if (has('phone')) {
    const phone = text(body.phone, 'Phone');
    if (!phone) throw new ProfileInputError("Phone can't be empty");
    $set.phone = phone;
  }
  if (has('address')) {
    if (typeof body.address !== 'object' || body.address === null || Array.isArray(body.address)) {
      throw new ProfileInputError('Address must be an object');
    }
    for (const part of ADDRESS_FIELDS) {
      if (body.address[part] !== undefined) $set[`address.${part}`] = text(body.address[part], `Address ${part}`);
    }
  }
  if (has('description')) $set.description = text(body.description, 'Description');
  if (has('website')) {
    const website = text(body.website, 'Website');
    if (website) $set.website = website;
    else $unset.website = '';
  }
  if (has('businessType')) {
    if (!BUSINESS_TYPES.includes(body.businessType)) {
      throw new ProfileInputError(`Business type must be one of: ${BUSINESS_TYPES.join(', ')}`);
    }
    $set.businessType = body.businessType;
  }
  if (has('acceptedWasteTypes')) {
    const types = body.acceptedWasteTypes;
    if (!Array.isArray(types) || types.length === 0) {
      throw new ProfileInputError('Choose at least one waste type you accept');
    }
    const unknown = types.filter((t) => !WASTE_TYPES.includes(t));
    if (unknown.length) throw new ProfileInputError(`Unknown waste type: ${unknown.join(', ')}`);
    $set.acceptedWasteTypes = [...new Set(types)];
  }
  if (has('operatingHours')) $set.operatingHours = body.operatingHours;

  return { $set, $unset };
}

/**
 * Applies the update and sends the response. Validation and bad-input errors
 * become 400 (never 401, which would sign the mobile app out).
 */
async function updateProfileAndRespond(res, Model, id, body, fields) {
  try {
    const { $set, $unset } = buildProfileUpdate(body, fields);
    const update = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;

    const account = Object.keys(update).length
      // Update validators only check the fields being changed, so older
      // profiles with missing required details can still save
      ? await Model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select('-password')
      : await Model.findById(id).select('-password');

    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    return res.status(200).json({ success: true, data: account, message: 'Profile updated' });
  } catch (error) {
    const isInputError = error instanceof ProfileInputError || error.name === 'ValidationError' || error.name === 'CastError';
    const message = error.name === 'ValidationError'
      ? Object.values(error.errors || {}).map((e) => e.message).join('. ') || error.message
      : error.message;
    return res.status(isInputError ? 400 : 500).json({ success: false, message });
  }
}

module.exports = { buildProfileUpdate, updateProfileAndRespond, ProfileInputError, WASTE_TYPES, BUSINESS_TYPES };
