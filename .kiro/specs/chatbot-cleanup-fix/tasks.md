# Implementation Plan - Chatbot Cleanup & Fix

## Task List

- [x] 1. Phase 1: Cleanup Dead Code


  - Delete V3 and V4 services, obsolete documentation, and unused tests
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 Delete V3 service file


  - Remove `services/tsa-ai/app/services/intelligent_chatbot_service.py`
  - _Requirements: 1.1_

- [x] 1.2 Delete V4 service file


  - Remove `services/tsa-ai/app/services/intelligent_chatbot_v4_service.py`
  - _Requirements: 1.1_

- [x] 1.3 Delete obsolete documentation


  - Remove `services/tsa-ai/DEPLOYMENT_CHATBOT_V3.md`
  - Remove `services/tsa-monolith/CHATBOT_V4_MIGRATION_GUIDE.md`
  - _Requirements: 1.3, 6.2_

- [x] 1.4 Delete obsolete test files


  - Remove `services/tsa-ai/scripts/test_chatbot_v3.py`
  - _Requirements: 1.4_

- [x] 1.5 Verify no imports reference V3/V4


  - Search codebase for imports of deleted services
  - Remove any found references
  - _Requirements: 1.2_

- [x] 2. Phase 2: Fix Security - Isolate Conversation History


  - Force conversation_id = user_id to prevent cross-user data access
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 2.1 Update process_message to force conversation_id


  - In `chatbot_function_calling_service.py`, change `conv_id = conversation_id or user_id` to `conv_id = user_id`
  - Add comment explaining security rationale
  - _Requirements: 4.1, 4.3_

- [x] 2.2 Update _save_to_memory with security note


  - Add docstring explaining that conversation_id is always user_id
  - _Requirements: 4.4_

- [ ]* 2.3 Write security test for history isolation
  - Create test that verifies users cannot access other users' history
  - Test malicious conversation_id parameter
  - _Requirements: 4.3, 5.4_

- [x] 3. Phase 3: Enhance Handlers to Read Real Data


  - Upgrade all handlers to query PostgreSQL database instead of faking data
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Implement _handle_track_shipment with real DB query


  - Query missions table with JOIN on addresses
  - Filter by user_id (affreteur_id OR transporteur_id)
  - Return real mission data (status, origin, destination, current_location)
  - _Requirements: 2.1_

- [ ]* 3.2 Write test for track_shipment real data
  - Create test mission in DB
  - Call handler
  - Verify real data is returned
  - _Requirements: 2.1, 5.2_

- [x] 3.3 Implement _handle_get_cart with real DB query


  - Query cart_items JOIN products
  - Filter by user_id
  - Calculate totals
  - _Requirements: 2.3_

- [ ]* 3.4 Write test for get_cart real data
  - Create test cart items
  - Verify real data and totals
  - _Requirements: 2.3, 5.2_

- [x] 3.5 Implement _handle_get_my_orders with real DB query


  - Query orders JOIN order_items
  - Filter by user_id and optional status
  - Support limit parameter
  - _Requirements: 2.2_

- [ ]* 3.6 Write test for get_my_orders real data
  - Create test orders
  - Verify filtering and limits work
  - _Requirements: 2.2, 5.2_

- [x] 3.7 Implement _handle_get_user_missions with real DB query

  - Query missions table
  - Filter by user_id based on role (affreteur_id or transporteur_id)
  - Support status filter and limit
  - _Requirements: 2.4_

- [ ]* 3.8 Write test for get_user_missions real data
  - Create test missions
  - Verify role-based filtering
  - _Requirements: 2.4, 5.2_

- [x] 3.9 Implement _handle_get_my_vehicles with real DB query

  - Query vehicles table
  - Filter by transporteur_id = user_id
  - Support status filter
  - _Requirements: 2.5_

- [ ]* 3.10 Write test for get_my_vehicles real data
  - Create test vehicles
  - Verify filtering works
  - _Requirements: 2.5, 5.2_

- [x] 3.11 Implement _handle_get_order_details with real DB query

  - Query orders JOIN order_items JOIN products
  - Filter by order_id AND user_id (security)
  - Return complete order details
  - _Requirements: 2.2_

- [ ]* 3.12 Write test for get_order_details real data
  - Create test order with items
  - Verify complete data returned
  - _Requirements: 2.2, 5.2_

- [x] 4. Phase 4: Fix Navigation Hints to Match Frontend Routes



  - Update all navigation hints to use correct React Router paths from App.tsx
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 4.1 Update _get_navigation_hint method


  - Replace all routes with `/app/*` prefix
  - Update track_shipment: `/app/mission/{id}/tracking`
  - Update get_product_details: `/app/shop/product/{id}`
  - Update get_order_details: `/app/shop/order/{id}`
  - Update calculate_price: `/app/missions/create`
  - Update get_cart: `/app/shop/cart` or `/app/shop`
  - Update static map routes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [ ]* 4.2 Write tests for navigation hints
  - Test each function's navigation hint
  - Verify routes match App.tsx
  - _Requirements: 3.1-3.9, 5.3_

- [ ] 5. Phase 5: Update Tests
  - Update existing tests to reflect new architecture
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 5.1 Update verify_chatbot_read_only.py
  - Remove V4 isolation test (test_history_isolated_by_user_id)
  - Update to only check Function Calling service
  - _Requirements: 5.1_

- [ ] 5.2 Update test_chatbot_read_only.py
  - Remove TestConversationHistoryIsolation class (V4 specific)
  - Keep other READ-ONLY tests
  - _Requirements: 5.1_

- [ ] 5.3 Update test_function_calling.py
  - Add tests for real data reads
  - Add tests for navigation hints
  - _Requirements: 5.2, 5.3_

- [ ]* 5.4 Run all tests and verify they pass
  - Execute pytest on all chatbot tests
  - Fix any failures
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Phase 6: Final Verification
  - Manual testing and documentation update
  - _Requirements: All_

- [ ] 6.1 Manual QA testing
  - Test each chatbot function with real user account
  - Verify navigation hints work in browser
  - Verify no cross-user data leakage
  - _Requirements: 2.1-2.5, 3.1-3.9, 4.1-4.3_

- [ ] 6.2 Update README or main documentation
  - Document that only Function Calling service is used
  - Remove references to V3/V4
  - Document navigation hints structure
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 6.3 Verify service health endpoint
  - Test `/api/ai/chatbot/health`
  - Ensure it returns correct version info
  - _Requirements: All_
