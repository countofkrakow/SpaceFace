const api = 'https://c6vrdtg6uc.execute-api.us-west-2.amazonaws.com/spaceface/';

export default {
  encode: (push_token) => api + 'encode?push_token=' + encodeURIComponent(push_token),
  encode_result: (id) => api + 'encode/result?id=' + encodeURIComponent(id),
};
