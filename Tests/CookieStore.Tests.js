/* eslint-disable max-lines-per-function */
import {CookieStore} from "@cedx/cookies";

/**
 * Tests the features of the {@link CookieStore} class.
 */
describe("CookieStore", () => {
	beforeEach(async () => {
		for (const cookie of await cookieStore.getAll()) await cookieStore.delete(/** @type {string} */ (cookie.name));
	});

	describe("keys", () => {
		it("should return an empty array for an empty cookie store", async () =>
			(await new CookieStore().keys).should.be.empty);

		it("should return the list of keys for a non-empty cookie store", async () => {
			await cookieStore.set("foo", '"bar"');
			await cookieStore.set("prefix:baz", '"qux"');
			(await new CookieStore().keys).should.have.ordered.members(["foo", "prefix:baz"]);
		});

		it("should handle the key prefix", async () => {
			await cookieStore.set("foo", '"bar"');
			await cookieStore.set("prefix:baz", '"qux"');
			(await new CookieStore({keyPrefix: "prefix:"}).keys).should.have.members(["baz"]);
		});
	});

	describe("length", () => {
		it("should return zero for an empty cookie store", async () =>
			(await new CookieStore().length).should.equal(0));

		it("should return the number of entries for a non-empty cookie store", async () => {
			await cookieStore.set("foo", '"bar"');
			await cookieStore.set("prefix:baz", '"qux"');
			(await new CookieStore().length).should.equal(2);
		});

		it("should handle the key prefix", async () => {
			await cookieStore.set("foo", '"bar"');
			await cookieStore.set("prefix:baz", '"qux"');
			(await new CookieStore({keyPrefix: "prefix:"}).length).should.equal(1);
		});
	});

	// describe("[Symbol.asyncIterator]()", () => {
	// 	it("should end iteration immediately if the cookie store is empty", async () => {
	// 		const iterator = new CookieStore()[Symbol.asyncIterator]();
	// 		/** @type {boolean} */ ((await iterator.next()).done).should.be.true;
	// 	});

	// 	it("should iterate over the values if the cookie store is not empty", async () => {
	// 		const iterator = new CookieStore()[Symbol.asyncIterator]();
	// 		await cookieStore.set("foo", '"bar"');
	// 		await cookieStore.set("prefix:baz", '"qux"');

	// 		let next = await iterator.next();
	// 		assert.isFalse(next.done);
	// 		assert.sameOrderedMembers(next.value, ["foo", "bar"]);
	// 		next = await iterator.next();
	// 		assert.isFalse(next.done);
	// 		assert.sameOrderedMembers(next.value, ["prefix:baz", "qux"]);
	// 		assert.isTrue((await iterator.next()).done);
	// 	});

	// 	it("should handle the key prefix", async () => {
	// 		const iterator = new CookieStore({keyPrefix: "prefix:"})[Symbol.asyncIterator]();
	// 		await cookieStore.set("foo", '"bar"');
	// 		await cookieStore.set("prefix:baz", '"qux"');

	// 		const next = await iterator.next();
	// 		assert.isFalse(next.done);
	// 		assert.sameOrderedMembers(next.value, ["baz", "qux"]);
	// 		assert.isTrue((await iterator.next()).done);
	// 	});
	// });

	describe("clear()", () => {
		it("should remove all cookies", async () => {
			await cookieStore.set("foo", '"bar"');
			await cookieStore.set("prefix:baz", '"qux"');

			await new CookieStore().clear();
			document.cookie.should.be.empty;
		});

		it("should handle the key prefix", async () => {
			await cookieStore.set("foo", '"bar"');
			await cookieStore.set("prefix:baz", '"qux"');

			await new CookieStore({keyPrefix: "prefix:"}).clear();
			document.cookie.should.equal('foo="bar"');
		});
	});

	describe("delete()", () => {
		it("should properly remove the cookies", async () => {
			await cookieStore.set("foo", '"bar"');
			await cookieStore.set("prefix:baz", '"qux"');

			await new CookieStore().delete("foo");
			document.cookie.should.equal('prefix:baz="qux"');
			should.not.exist(await cookieStore.get("foo"));
		});

		it("should handle the key prefix", async () => {
			await cookieStore.set("foo", '"bar"');
			await cookieStore.set("prefix:baz", '"qux"');

			await new CookieStore({keyPrefix: "prefix:"}).delete("baz");
			document.cookie.should.equal('foo="bar"');
			should.not.exist(await cookieStore.get("prefix:baz"));
		});
	});

	describe("get()", () => {
		it("should properly get the deserialized cookies", async () => {
			const service = new CookieStore;
			should.not.exist(await service.get("foo"));

			await cookieStore.set("foo", '"bar"');
			/** @type {string} */ (await service.get("foo")).should.equal("bar");

			await cookieStore.set("foo", "123");
			/** @type {number} */ (await service.get("foo")).should.equal(123);

			await cookieStore.set("foo", '{"key": "value"}');
			/** @type {object} */ (await service.get("foo")).should.deep.equal({key: "value"});

			await cookieStore.set("foo", "{bar[123]}");
			should.not.exist(await service.get("foo"));

			await cookieStore.delete("foo");
			should.not.exist(await service.get("foo"));
		});

		it("should handle the key prefix", async () => {
			const service = new CookieStore({keyPrefix: "prefix:"});
			should.not.exist(await service.get("baz"));

			await cookieStore.set("prefix:baz", '"qux"');
			/** @type {string} */ (await service.get("baz")).should.equal("qux");

			await cookieStore.set("prefix:baz", "456");
			/** @type {number} */ (await service.get("baz")).should.equal(456);

			await cookieStore.set("prefix:baz", '{"key": "value"}');
			/** @type {object} */ (await service.get("baz")).should.deep.equal({key: "value"});

			await cookieStore.set("prefix:baz", "{qux[456]}");
			should.not.exist(await service.get("baz"));

			await cookieStore.delete("prefix:baz");
			should.not.exist(await service.get("baz"));
		});
	});

	describe("has()", () => {
		it("should return `false` if the specified key is not contained", async () =>
			(await new CookieStore().has("foo")).should.be.false);

		it("should return `true` if the specified key is contained", async () => {
			await cookieStore.set("foo", '"bar"');
			await cookieStore.set("prefix:baz", '"qux"');

			const service = new CookieStore;
			(await service.has("foo:bar")).should.be.false;
			(await service.has("foo")).should.be.true;
			(await service.has("prefix:baz")).should.be.true;
		});

		it("should handle the key prefix", async () => {
			await cookieStore.set("foo", '"bar"');
			await cookieStore.set("prefix:baz", '"qux"');

			const service = new CookieStore({keyPrefix: "prefix:"});
			(await service.has("foo")).should.be.false;
			(await service.has("baz")).should.be.true;
		});
	});

	describe("onChange()", () => {
		it("should trigger an event when a cookie is added", async () => {
			const listener = (/** @type {import("@cedx/cookies").CookieEvent} */ event) => {
				event.key.should.equal("foo");
				should.not.exist(event.oldValue);
				/** @type {string} */ (event.newValue).should.equal("bar"); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
			};

			const service = new CookieStore;
			const abortController = service.onChange(listener);
			await service.set("foo", "bar");
			abortController.abort();
		});

		it("should trigger an event when a cookie is updated", async () => {
			await cookieStore.set("foo", '"bar"');
			const listener = (/** @type {import("@cedx/cookies").CookieEvent} */ event) => {
				event.key.should.equal("foo");
				/** @type {string} */ (event.oldValue).should.equal("bar"); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
				/** @type {string} */ (event.newValue).should.equal("baz"); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
			};

			const service = new CookieStore;
			const abortController = service.onChange(listener);
			await service.set("foo", "baz");
			abortController.abort();
		});

		it("should trigger an event when a cookie is removed", async () => {
			await cookieStore.set("foo", '"bar"');
			const listener = (/** @type {import("@cedx/cookies").CookieEvent} */ event) => {
				event.key.should.equal("foo");
				/** @type {string} */ (event.oldValue).should.equal("bar"); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
				should.not.exist(event.newValue);
			};

			const service = new CookieStore;
			const abortController = service.onChange(listener);
			await service.delete("foo");
			abortController.abort();
		});

		it("should handle the key prefix", async () => {
			const listener = (/** @type {import("@cedx/cookies").CookieEvent} */ event) => {
				event.key.should.equal("baz");
				should.not.exist(event.oldValue);
				/** @type {string} */ (event.newValue).should.equal("qux"); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
			};

			const service = new CookieStore({keyPrefix: "prefix:"});
			const abortController = service.onChange(listener);
			await service.set("baz", "qux");
			abortController.abort();
		});
	});

	describe("set()", () => {
		// it("should properly serialize and set the cookies", async () => {
		// 	const service = new CookieStore;
		// 	should.not.exist(await cookieStore.get("foo"));

		// 	await service.set("foo", "bar");
		// 	assert.equal((await cookieStore.get("foo"))?.value, '"bar"');

		// 	await service.set("foo", 123);
		// 	assert.equal((await cookieStore.get("foo"))?.value, "123");

		// 	await service.set("foo", {key: "value"});
		// 	assert.equal((await cookieStore.get("foo"))?.value, '{"key":"value"}');
		// });

	// 	it("should handle the key prefix", async () => {
	// 		const service = new CookieStore({keyPrefix: "prefix:"});
	// 		should.not.exist(await cookieStore.get("prefix:baz"));

	// 		await service.set("baz", "qux");
	// 		assert.equal((await cookieStore.get("prefix:baz"))?.value, '"qux"');

	// 		await service.set("baz", 456);
	// 		assert.equal((await cookieStore.get("prefix:baz"))?.value, "456");

	// 		await service.set("baz", {key: "value"});
	// 		assert.equal((await cookieStore.get("prefix:baz"))?.value, '{"key":"value"}');
	// 	});
	});
});
