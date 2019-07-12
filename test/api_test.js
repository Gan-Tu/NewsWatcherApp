var assert = require('assert');
var app = require('../server.js');
app.testrun = true;
var request = require('supertest')(app);

// wait until database is up and connected
// before we start the tests
setTimeout(function() {

    describe("Testing all API operations", function() {

        // Shut everything down gracefully
        after(function(done) {
            console.log("\n\n[INFO] All basic API operation tests finished.")
            app.db.client.close();
            console.log('[INFO] Database connection gracefully closed.');
            app.node2.kill();
            console.log('[INFO] Forked worker gracefully killed.');
            app.close(done);
            console.log('[INFO] App closed.');
        });


        /**
         * TEST: sessions for login and logout
         */
        describe("Testing login and logout", function() {
            var token;

            describe("POST /api/session", function() {

                it("should login successfully with correct credentials", function(done) {
                    request.post("/api/session")
                           .send({
                                "email": "hello@example.com",
                                "password": "8_LRdb-*793u"
                            })
                           .end(function(err, res) {
                                assert.equal(res.status, 200);
                                assert.equal(res.body.msg, "Successfully logged in");
                                done();
                            })
                });

                it("should fail to login for unregistered Users");
                it("should fail to login with incorrect email");
                it("should fail to login with incorrect password");
            });

            describe("DELETE /api/session", function() {
                it("should allow logged-in User to logout");

                describe("Attempt to logout unauthenticated Users", function() {
                    it("should fail without auth token");
                    it("should fail with empty auth token");
                });

                describe("Attempt to logout with tampered auth token", function() {
                    it("should fail with different IP");
                    it("should fail with different User-Agent");
                    it("should fail with invalid auth token");
                });
            });
        });


        /**
         * TEST: user profile operations
         */
        describe("Testing user profile operations", function() {
            var token;

            describe("POST /api/users/", function() {
                it("should successfully create a User");

                describe("Attempt to create duplicate Users", function() {
                    it("should not create a User twice");
                    it("should not create a different User with same email");
                });

                describe("Attempt to create Users with invalid schema", function() {
                    it("should fail with invalid: email");
                    it("should fail with invalid: password");
                    it("should fail with invalid: displayName");
                });
            });

            describe("DELETE /api/users/:id", function() {
                it("should allow logged-in User to delete itself");
                it("should fail to delete unregistered Users");
                it("should fail to delete unauthenticated Users");
                it("should fail to delete Users without authorized access");
            });

            describe("GET /api/users/:id", function() {
                it("should allow logged-in user to fetch its own profile");
                it("should fail to fetch profiles of unauthenticated users");
                it("should fail to fetch User profile without authorized access");
            });

            describe("PUT /api/users/:id", function() {
                it("should successfully update the profile with profile settings");
                it("should successfully update the profile with new news filters");

                describe("Attempt to update User profiles with invalid schema", function() {
                    it("should fail with invalid/missing setting: requireWIFI");
                    it("should fail with invalid/missing setting: enableAlerts");
                    it("should fail with invalid news filters schema");
                    it("should fail with too many news filters");
                });

                it("should fail to update User profile without authorized access");
            });
        });


        /**
         * TEST: saved news stories for Users
         */
        describe("Testing saved news stories for Users", function() {
            describe("GET /api/users/:id/savedstories", function() {
                it("should successfully fetch saved stories for logged-in user");
                it("should fail to fetch saved stories without authorized access");
            });

            describe("POST /api/users/:id/savedstories", function() {
                it("should successfully save a news story for the logged-in user");
                it("should fail to save stories with invalid story schema");
                it("should fail to save stories when maximum story limit is hit");
                it("should fail to save news stories without authorized access");
            });

            describe("DELETE /api/users/:id/savedstories/:sid", function() {
                it("should successfully delete a saved story for the logged-in user");
                it("should be OK to delete unsaved stories from users.");
                it("should fail to delete stories from unregistered users.");
                it("should fail to delete saved stories without authorized access");
            });
        });


        /**
         * TEST: home news
         */
        describe("Testing home news", function() {
            describe("GET /api/homeNews", function() {
                it("should fetch home news");
            });
        });


        /**
         * TEST: news stories sharing operations
         */
        describe("Testing news stories sharing operations", function() {
            describe("POST /api/sharedNews/", function() {
                it("should successfully create a shared news story");
                it("should fail to share stories when maximum share limit is hit");
                it("should fail to share a story without authorized access");
            });

            describe("GET /api/sharedNews/", function() {
                it("should successfully fetch shared news stories and comments");
                it("should fail to fetch shared stories without authorized access");
            });

            describe("DELETE /api/sharedNews/:sid", function() {
                it("should successfully delete the shared news story using ADMIN_TOKEN");
                it("should fail to delete shared stories without ADMIN_TOKEN");
                it("should fail to delete shared stories without authorized access");
            });

            describe("POST /api/sharedNews/:sid/comments", function() {
                it("should successfully add a new comment");
                it("should have the added comment for the news story");
                it("should fail to add comment when maximum comment limit is hit");
                it("should fail to add comments without authorized access");
            });
        });

        /**
         * TEST: miscellaneous
         */
        describe("Testing invalid requests", function() {
            it('should return 404 errors for invalid requests');
        });

    });


    describe("Testing forked child process", function() {
        it("should restart forked child process upon crash, in production");
        it("should return updated news stories");
        it("should move a news story to the savedStories folder");
        it("should delete a news story from the savedStories folder");
        it("should return updated news stories");
    });

    // run the tests
    run();

}, 3000);
