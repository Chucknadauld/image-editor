import * as fs from "fs";

class Color {
	red: number;
	green: number;
	blue: number;
	constructor() {
		this.red = 0;
		this.green = 0;
		this.blue = 0;
	}
}

class Image {
	private pixels: (Color | undefined)[][];
	constructor(width: number, height: number) {
		this.pixels = new Array(width);
		for (let x = 0; x < width; x++) {
			this.pixels[x] = new Array<Color | undefined>(height);
		}
	}
	getWidth(): number {
		return this.pixels.length;
	}
	getHeight(): number {
		return this.pixels[0]!.length;
	}
	set(x: number, y: number, c: Color): void {
		this.pixels[x]![y] = c;
	}
	get(x: number, y: number): Color {
		return this.pixels[x]![y]!;
	}
}

function usage(): void {
	console.log("USAGE: java ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}");
}

function clampToByte(v: number): number {
	if (v < 0) return 0;
	if (v > 255) return 255;
	return v;
}

function grayscale(image: Image): void {
	for (let x = 0; x < image.getWidth(); ++x) {
		for (let y = 0; y < image.getHeight(); ++y) {
			const c = image.get(x, y);
			let gray = Math.floor((c.red + c.green + c.blue) / 3);
			gray = clampToByte(gray);
			c.red = gray;
			c.green = gray;
			c.blue = gray;
		}
	}
}

function invert(image: Image): void {
	for (let x = 0; x < image.getWidth(); ++x) {
		for (let y = 0; y < image.getHeight(); ++y) {
			const c = image.get(x, y);
			c.red = 255 - c.red;
			c.green = 255 - c.green;
			c.blue = 255 - c.blue;
		}
	}
}

function emboss(image: Image): void {
	for (let x = image.getWidth() - 1; x >= 0; --x) {
		for (let y = image.getHeight() - 1; y >= 0; --y) {
			const cur = image.get(x, y);
			let diff = 0;
			if (x > 0 && y > 0) {
				const upLeft = image.get(x - 1, y - 1);
				if (Math.abs(cur.red - upLeft.red) > Math.abs(diff)) {
					diff = cur.red - upLeft.red;
				}
				if (Math.abs(cur.green - upLeft.green) > Math.abs(diff)) {
					diff = cur.green - upLeft.green;
				}
				if (Math.abs(cur.blue - upLeft.blue) > Math.abs(diff)) {
					diff = cur.blue - upLeft.blue;
				}
			}
			let gray = clampToByte(128 + diff);
			cur.red = gray;
			cur.green = gray;
			cur.blue = gray;
		}
	}
}

function motionblur(image: Image, length: number): void {
	if (length < 1) return;
	for (let x = 0; x < image.getWidth(); ++x) {
		for (let y = 0; y < image.getHeight(); ++y) {
			const cur = image.get(x, y);
			let maxX = Math.min(image.getWidth() - 1, x + length - 1);
			for (let i = x + 1; i <= maxX; ++i) {
				const tmp = image.get(i, y);
				cur.red += tmp.red;
				cur.green += tmp.green;
				cur.blue += tmp.blue;
			}
			const delta = maxX - x + 1;
			cur.red = Math.floor(cur.red / delta);
			cur.green = Math.floor(cur.green / delta);
			cur.blue = Math.floor(cur.blue / delta);
		}
	}
}

function readImage(filePath: string): Image {
	const text = fs.readFileSync(filePath, "utf8");
	const tokens = text.trim().split(/\s+/);
	let i = 0;
	i++;
	const width = parseInt(tokens[i++]!, 10);
	const height = parseInt(tokens[i++]!, 10);
	const image = new Image(width, height);
	i++;
	for (let y = 0; y < height; ++y) {
		for (let x = 0; x < width; ++x) {
			const c = new Color();
			c.red = parseInt(tokens[i++]!, 10);
			c.green = parseInt(tokens[i++]!, 10);
			c.blue = parseInt(tokens[i++]!, 10);
			image.set(x, y, c);
		}
	}
	return image;
}

function writeImage(image: Image, filePath: string): void {
	const fd = fs.openSync(filePath, "w");
	try {
		fs.writeSync(fd, "P3\r\n");
		fs.writeSync(fd, `${image.getWidth()} ${image.getHeight()}\r\n`);
		fs.writeSync(fd, "255\r\n");
		for (let y = 0; y < image.getHeight(); ++y) {
			for (let x = 0; x < image.getWidth(); ++x) {
				const c = image.get(x, y);
				const prefix = x === 0 ? "" : " ";
				fs.writeSync(fd, `${prefix}${c.red} ${c.green} ${c.blue}`);
			}
			fs.writeSync(fd, "\r\n");
		}
	} finally {
		fs.closeSync(fd);
	}
}

function main(argv: string[]): void {
	if (argv.length < 3) {
		usage();
		return;
	}
	const inputFile = argv[0]!;
	const outputFile = argv[1]!;
	const filter = argv[2]!;
	const image = readImage(inputFile);
	if (filter === "grayscale" || filter === "greyscale") {
		if (argv.length !== 3) {
			usage();
			return;
		}
		grayscale(image);
	} else if (filter === "invert") {
		if (argv.length !== 3) {
			usage();
			return;
		}
		invert(image);
	} else if (filter === "emboss") {
		if (argv.length !== 3) {
			usage();
			return;
		}
		emboss(image);
	} else if (filter === "motionblur") {
		if (argv.length !== 4) {
			usage();
			return;
		}
		const len = parseInt(argv[3]!, 10);
		if (!(len >= 0)) {
			usage();
			return;
		}
		motionblur(image, len);
	} else {
		usage();
		return;
	}
	writeImage(image, outputFile);
}

main(process.argv.slice(2));

