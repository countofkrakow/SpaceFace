const api = 'https://c6vrdtg6uc.execute-api.us-west-2.amazonaws.com/spaceface/';

export default {
  encode: (push_token) => api + 'encode?push_token=' + encodeURIComponent(push_token),
  encode_result: (id) => api + 'encode/result?id=' + encodeURIComponent(id),
  manipulate: (args) =>
    api +
    'edit?' +
    Object.keys(args)
      .map((arg) => `${arg}=${args[arg]}`)
      .join('&'),
  manipulate_result: (id) => api + 'edit/result?id=' + encodeURIComponent(id),
  fom_video_upload: (fileName) => 'https://fom-input.s3-us-west-2.amazonaws.com/' + fileName,
  fom_process_video: (id) => api + 'fom-frontdoor?id=' + encodeURIComponent(id),
  fom_video_result: (id) => `https://fom-output.s3-us-west-2.amazonaws.com/${id}.mp4`,
  fom_video_status: (id) => `https://fom-output.s3-us-west-2.amazonaws.com/${id}.mp4_status`,
};
