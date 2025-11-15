#!/usr/bin/env python3
"""
Script de test rapide pour le Chatbot V3 Unifié
Usage: python scripts/test_chatbot_v3.py
"""

import asyncio
import httpx
import json
import time
from typing import Dict, Any


BASE_URL = "http://localhost:8000"
TEST_USER_ID = "test-user-123"
TEST_USER_ROLE = "AFFRETEUR"


class Colors:
    """ANSI color codes"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_header(text: str):
    """Print colored header"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}\n")


def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")


def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")


def print_info(text: str):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.RESET}")


def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")


async def test_health_check():
    """Test 1: Health check endpoint"""
    print_header("Test 1: Health Check")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/api/ai/chatbot/health")
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Health check passed")
                print_info(f"Version: {data.get('version')}")
                print_info(f"Architecture: {data.get('architecture')}")
                print_info(f"Features: {len(data.get('features', []))} features")
                return True
            else:
                print_error(f"Health check failed: {response.status_code}")
                return False
    except Exception as e:
        print_error(f"Health check error: {e}")
        return False


async def test_normal_query():
    """Test 2: Normal query (JSON response)"""
    print_header("Test 2: Normal Query (JSON)")
    
    test_messages = [
        "Bonjour",
        "Combien coûte Douala → Yaoundé pour 500kg ?",
        "Quelles sont mes missions ?",
    ]
    
    results = []
    
    for message in test_messages:
        print_info(f"Testing: '{message}'")
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{BASE_URL}/api/ai/chatbot/query",
                    json={
                        "message": message,
                        "user_id": TEST_USER_ID,
                        "user_role": TEST_USER_ROLE,
                    }
                )
                
                elapsed = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    print_success(f"Response received in {elapsed:.0f}ms")
                    print(f"   📝 Message: {data.get('message', '')[:100]}...")
                    print(f"   💡 Suggestions: {len(data.get('suggestions', []))} suggestions")
                    
                    if 'processing_time_ms' in data:
                        print(f"   ⏱️  Processing time: {data['processing_time_ms']:.0f}ms")
                    
                    results.append(True)
                else:
                    print_error(f"Query failed: {response.status_code}")
                    results.append(False)
                    
        except Exception as e:
            print_error(f"Query error: {e}")
            results.append(False)
        
        print()
    
    success_rate = (sum(results) / len(results)) * 100
    print_info(f"Success rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")
    
    return all(results)


async def test_streaming_query():
    """Test 3: Streaming query (SSE)"""
    print_header("Test 3: Streaming Query (SSE)")
    
    message = "Combien coûte un transport de Douala à Yaoundé pour 500kg ?"
    print_info(f"Testing: '{message}'")
    
    try:
        start_time = time.time()
        first_chunk_time = None
        chunks_received = 0
        full_message = ""
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream(
                "POST",
                f"{BASE_URL}/api/ai/chatbot/query/stream",
                json={
                    "message": message,
                    "user_id": TEST_USER_ID,
                    "user_role": TEST_USER_ROLE,
                }
            ) as response:
                if response.status_code != 200:
                    print_error(f"Streaming failed: {response.status_code}")
                    return False
                
                print_success("Streaming started")
                print(f"\n{Colors.CYAN}📡 Receiving chunks:{Colors.RESET}\n")
                
                async for line in response.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    
                    data_str = line[6:]  # Remove "data: " prefix
                    data = json.loads(data_str)
                    
                    if data.get("type") == "start":
                        print_info("Stream started")
                    
                    elif data.get("type") == "chunk":
                        if first_chunk_time is None:
                            first_chunk_time = (time.time() - start_time) * 1000
                            print_success(f"First chunk received in {first_chunk_time:.0f}ms")
                        
                        chunks_received += 1
                        content = data.get("content", "")
                        full_message += content
                        print(content, end="", flush=True)
                    
                    elif data.get("type") == "done":
                        total_time = (time.time() - start_time) * 1000
                        print(f"\n\n{Colors.GREEN}✅ Streaming completed{Colors.RESET}")
                        print_info(f"Total time: {total_time:.0f}ms")
                        print_info(f"First chunk: {first_chunk_time:.0f}ms")
                        print_info(f"Chunks received: {chunks_received}")
                        print_info(f"Suggestions: {len(data.get('suggestions', []))}")
                        
                        if 'processing_time_ms' in data:
                            print_info(f"Server processing: {data['processing_time_ms']:.0f}ms")
                        
                        return True
                    
                    elif data.get("type") == "error":
                        print_error(f"Stream error: {data.get('message')}")
                        return False
        
        return False
        
    except Exception as e:
        print_error(f"Streaming error: {e}")
        return False


async def test_performance_comparison():
    """Test 4: Compare normal vs streaming performance"""
    print_header("Test 4: Performance Comparison")
    
    message = "Prix Douala Yaoundé 500kg"
    
    # Test normal mode
    print_info("Testing normal mode...")
    try:
        start_normal = time.time()
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/api/ai/chatbot/query",
                json={
                    "message": message,
                    "user_id": TEST_USER_ID,
                    "user_role": TEST_USER_ROLE,
                }
            )
        time_normal = (time.time() - start_normal) * 1000
        
        if response.status_code == 200:
            print_success(f"Normal mode: {time_normal:.0f}ms")
        else:
            print_error(f"Normal mode failed: {response.status_code}")
            time_normal = None
    except Exception as e:
        print_error(f"Normal mode error: {e}")
        time_normal = None
    
    # Test streaming mode
    print_info("Testing streaming mode...")
    try:
        start_stream = time.time()
        first_chunk_time = None
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream(
                "POST",
                f"{BASE_URL}/api/ai/chatbot/query/stream",
                json={
                    "message": message,
                    "user_id": TEST_USER_ID,
                    "user_role": TEST_USER_ROLE,
                }
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = json.loads(line[6:])
                        if data.get("type") == "chunk" and first_chunk_time is None:
                            first_chunk_time = (time.time() - start_stream) * 1000
                            break
        
        if first_chunk_time:
            print_success(f"Streaming mode (first chunk): {first_chunk_time:.0f}ms")
        else:
            print_error("Streaming mode failed")
    except Exception as e:
        print_error(f"Streaming mode error: {e}")
        first_chunk_time = None
    
    # Compare
    if time_normal and first_chunk_time:
        improvement = ((time_normal - first_chunk_time) / time_normal) * 100
        print(f"\n{Colors.BOLD}📊 Performance Comparison:{Colors.RESET}")
        print(f"   Normal: {time_normal:.0f}ms")
        print(f"   Streaming: {first_chunk_time:.0f}ms")
        print(f"   {Colors.GREEN}Improvement: {improvement:.1f}% faster{Colors.RESET}")
        return True
    
    return False


async def test_metrics():
    """Test 5: Metrics endpoint"""
    print_header("Test 5: Metrics")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/api/ai/chatbot/metrics")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    stats = data.get("stats", {})
                    print_success("Metrics retrieved")
                    print_info(f"Total queries: {stats.get('total_queries', 0)}")
                    print_info(f"Success rate: {stats.get('success_rate', 0):.2f}%")
                    print_info(f"Human required: {stats.get('human_required_rate', 0):.2f}%")
                    
                    function_calls = stats.get('function_calls', {})
                    if function_calls:
                        print_info(f"Function calls: {sum(function_calls.values())}")
                    
                    return True
                else:
                    print_warning("Metrics not available (Redis not configured?)")
                    return True  # Not a critical failure
            else:
                print_error(f"Metrics failed: {response.status_code}")
                return False
    except Exception as e:
        print_error(f"Metrics error: {e}")
        return False


async def main():
    """Run all tests"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║         🤖 Chatbot TSA V3 - Test Suite                    ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.RESET}")
    
    print_info(f"Base URL: {BASE_URL}")
    print_info(f"Test User: {TEST_USER_ID} ({TEST_USER_ROLE})")
    
    # Run tests
    results = {
        "Health Check": await test_health_check(),
        "Normal Query": await test_normal_query(),
        "Streaming Query": await test_streaming_query(),
        "Performance Comparison": await test_performance_comparison(),
        "Metrics": await test_metrics(),
    }
    
    # Summary
    print_header("Test Summary")
    
    for test_name, passed in results.items():
        if passed:
            print_success(f"{test_name}")
        else:
            print_error(f"{test_name}")
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    success_rate = (passed_tests / total_tests) * 100
    
    print(f"\n{Colors.BOLD}📊 Overall Results:{Colors.RESET}")
    print(f"   Tests passed: {passed_tests}/{total_tests}")
    print(f"   Success rate: {success_rate:.1f}%")
    
    if success_rate == 100:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 All tests passed! Chatbot V3 is ready!{Colors.RESET}\n")
    elif success_rate >= 80:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  Most tests passed, but some issues detected.{Colors.RESET}\n")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ Multiple tests failed. Please check the logs.{Colors.RESET}\n")
    
    return success_rate == 100


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}⚠️  Tests interrupted by user{Colors.RESET}\n")
        exit(1)
    except Exception as e:
        print(f"\n\n{Colors.RED}❌ Fatal error: {e}{Colors.RESET}\n")
        exit(1)
