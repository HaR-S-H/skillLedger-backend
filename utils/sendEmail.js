import emailQueue from "../queues/email.queues.js";

const sendEmail = async (type, payload) => {
  await emailQueue.add(type, payload,  { removeOnComplete: true, removeOnFail: true });
};

export default sendEmail;
