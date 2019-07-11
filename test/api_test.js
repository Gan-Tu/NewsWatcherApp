var assert = require('assert');
var app = require('../server.js');
app.testrun = true;
var request = require('supertest')(app);

// wait until database is up and connected
// before we start the tests
setTimeout(function() {
    describe("Testing basic API operations", function() {

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
                it("correct credentials should login successfully", function(done) {
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

                // pending
                it("incorrect credentials should fail login");
            });

            describe("DELETE /api/session", function() {
                // pending
                it("correct credentials should login out successfully");
                it("incorrect credentials should fail to login out");
            });
        });
    })

    // run the tests
    run();

}, 3000);
