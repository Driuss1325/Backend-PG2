import { CommunityPost } from "../models/index.js";
export async function publicList(req, res) {
  const posts = await CommunityPost.findAll({
    where: { status: "visible" },
    order: [["createdAt", "DESC"]],
    limit: 200,
  });
  res.json(posts);
}
export async function publicCreate(req, res) {
  const { authorName, content, lat, lng } = req.body;
  if (!authorName || !content)
    return res
      .status(400)
      .json({ error: "authorName y content son requeridos" });
  const post = await CommunityPost.create({
    authorName,
    content,
    lat,
    lng,
    status: "visible",
  });
  res.status(201).json(post);
}
export async function adminHide(req, res) {
  const { id } = req.params;
  const post = await CommunityPost.findByPk(id);
  if (!post) return res.status(404).json({ error: "No encontrado" });
  post.status = "hidden";
  await post.save();
  res.json({ ok: true });
}
