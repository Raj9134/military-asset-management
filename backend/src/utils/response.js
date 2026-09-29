// The two response shapes the whole API uses.
// Controllers only ever call these, which is why every endpoint replies
// with the same envelope without anyone having to remember the format.

export function sendSuccess(res, status, message, data = null) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

export function sendPaginated(res, message, { page, limit, total, data }) {
  return res.status(200).json({
    success: true,
    message,
    data: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    },
  });
}
