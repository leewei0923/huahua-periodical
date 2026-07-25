import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

const projectRoot = process.cwd();
const contentRoot = resolve(projectRoot, 'src', 'content', 'blog');
const config = JSON.parse(await readFile(join(projectRoot, 'config.json'), 'utf8'));

const args = process.argv.slice(2).filter((argument) => argument !== '--');
const flags = new Map();
const positionals = [];

for (const argument of args) {
	if (!argument.startsWith('--')) {
		positionals.push(argument);
		continue;
	}

	const [name, ...value] = argument.slice(2).split('=');
	flags.set(name, value.length > 0 ? value.join('=') : true);
}

if (flags.has('help')) {
	console.log(`创建一篇可自行填写的内容草稿。

用法：
  pnpm content:new
  pnpm content:new -- <slug>
  pnpm content:new -- <slug> --type=note --title="标题"

选项：
  --title=<标题>          预填标题
  --description=<摘要>   预填摘要
  --type=<类型>          essay、note、photo 或 link
  --topics=<主题>        逗号分隔，例如：生活,随笔
  --mdx                  生成 .mdx 文件（默认生成 .md）
  --publish              直接设为 published（默认是 draft）
  --help                 显示帮助`);
	process.exit(0);
}

const pad = (value) => String(value).padStart(2, '0');

function shanghaiDate(date = new Date()) {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat('en-CA', {
			timeZone: config.publication.timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hourCycle: 'h23',
		})
			.formatToParts(date)
			.filter((part) => part.type !== 'literal')
			.map((part) => [part.type, part.value]),
	);

	return {
		compact: `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`,
		iso: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`,
	};
}

function yamlString(value) {
	return JSON.stringify(String(value));
}

function yamlList(values) {
	return `[${values.map(yamlString).join(', ')}]`;
}

function bodyTemplate(type) {
	switch (type) {
		case 'note':
			return `<!-- 在这里写下这则短记。 -->`;
		case 'photo':
			return `<!-- 在这里放入图片并写下说明。

![图片说明](图片地址)
-->`;
		case 'link':
			return `<!-- 在这里填写链接与摘选理由。

[链接标题](https://example.com)
-->`;
		default:
			return `<!-- 从这里开始写正文。

## 小标题

正文内容……
-->`;
	}
}

function optionalValue(name) {
	const value = flags.get(name);
	if (value === undefined || value === true) return undefined;
	return value.trim();
}

const now = shanghaiDate();
const slug = (positionals[0] ?? `untitled-${now.compact}`).replace(/\.(md|mdx)$/i, '');
const validSegment = String.raw`[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*`;
const validSlug = new RegExp(`^${validSegment}(?:/${validSegment})*$`, 'u');

if (!validSlug.test(slug)) {
	console.error('slug 只能包含文字、数字、连字符和用于分目录的正斜杠，且不能以连字符开头或结尾。');
	process.exit(1);
}

const defaults = config.content.defaults;
const type = optionalValue('type') ?? defaults.contentType;
if (!(type in config.content.types)) {
	console.error(`无效的内容类型：${type}。可用值：${Object.keys(config.content.types).join('、')}`);
	process.exit(1);
}

const topicsArgument = optionalValue('topics');
const topics = topicsArgument
	? topicsArgument.split(',').map((topic) => topic.trim()).filter(Boolean)
	: defaults.topics;
if (topics.length === 0) {
	console.error('topics 不能为空。');
	process.exit(1);
}

const extension = flags.has('mdx') ? '.mdx' : '.md';
const target = resolve(contentRoot, `${slug}${extension}`);
if (target !== contentRoot && !target.startsWith(`${contentRoot}\\`) && !target.startsWith(`${contentRoot}/`)) {
	console.error('目标文件必须位于 src/content/blog 目录内。');
	process.exit(1);
}

try {
	await access(target);
	console.error(`文件已存在，未覆盖：${relative(projectRoot, target)}`);
	process.exit(1);
} catch {
	// File does not exist, so it is safe to create.
}

const title = optionalValue('title') ?? '待填写：文章标题';
const description = optionalValue('description') ?? '待填写：用一两句话概括这篇内容。';
const status = flags.has('publish') ? 'published' : 'draft';
const source = `---
title: ${yamlString(title)}
description: ${yamlString(description)}
pubDate: ${yamlString(now.iso)}
language: ${yamlString(defaults.language)}
contentType: ${yamlString(type)}
status: ${yamlString(status)}
author: ${yamlString(defaults.author)}
topics: ${yamlList(topics)}
featured: false
evergreen: false
---

${bodyTemplate(type)}
`;

await mkdir(dirname(target), { recursive: true });
await writeFile(target, source, 'utf8');

console.log(`已创建：${relative(projectRoot, target)}`);
console.log(`状态：${status === 'draft' ? '草稿（填写完成后将 status 改为 published）' : '已发布'}`);
