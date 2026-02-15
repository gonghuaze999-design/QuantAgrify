
import os
import sys
from google.cloud import bigquery
from google.oauth2.service_account import Credentials

# --- 配置区域 ---
KEY_PATH = "service_account.json"  # 请确保您的 json 密钥在项目根目录，或者修改此路径
PROJECT_ID = None # 如果 json 里包含了 project_id，这里留空即可；否则请手动填入
DATASET_ID = "quant_database"
TABLE_ID = "futures_1min"

def debug_bigquery():
    print("🚀 开始 BigQuery 深度诊断...")

    # 1. 连接检查
    if not os.path.exists(KEY_PATH):
        print(f"❌ 错误: 找不到密钥文件: {KEY_PATH}")
        print("   请把您的 Google Cloud Service Account JSON 文件放到根目录并重命名为 service_account.json")
        return

    try:
        creds = Credentials.from_service_account_file(KEY_PATH)
        client = bigquery.Client(credentials=creds, project=creds.project_id)
        project = client.project
        print(f"✅ 连接成功! Project ID: {project}")
    except Exception as e:
        print(f"❌ 连接失败: {str(e)}")
        return

    full_table_id = f"{project}.{DATASET_ID}.{TABLE_ID}"
    print(f"🔍 正在检查表: {full_table_id}")

    # 2. 检查表是否存在 & 查看表结构
    try:
        table = client.get_table(full_table_id)
        print(f"✅ 表存在。行数: {table.num_rows} 行")
        print("📋 表结构 (Schema):")
        for schema in table.schema:
            print(f"   - {schema.name} ({schema.field_type})")
    except Exception as e:
        print(f"❌ 无法获取表信息 (表可能不存在或名字错了): {str(e)}")
        return

    # 3. 采样数据 (看看真实存进去的数据长什么样)
    print("\n🧐 采样前 5 条原始数据 (Raw Sample):")
    query_sample = f"""
        SELECT * FROM `{full_table_id}` LIMIT 5
    """
    try:
        rows = list(client.query(query_sample).result())
        if not rows:
            print("⚠️ 警告: 表是空的 (0 rows)。")
        for row in rows:
            # 打印成字典方便看
            print(dict(row))
            
        if rows:
            sample_symbol = rows[0].get('symbol')
            print(f"\n💡 关键发现: 数据库里的 Symbol 格式是: '{sample_symbol}'")
    except Exception as e:
        print(f"❌ 查询失败: {str(e)}")

    # 4. 针对性测试 (测试 C9999)
    # 我们同时测试带 'X' 和不带 'X' 的情况
    print("\n🎯 针对性匹配测试 (C9999):")
    
    target_date = "2025-12-01" # 根据您的截图，这是有数据的时间段
    
    # Test 1: XDCE (文件名里的格式)
    query_xdce = f"""
        SELECT COUNT(*) as count FROM `{full_table_id}` 
        WHERE symbol LIKE '%XDCE%' AND date >= '{target_date}'
    """
    count_xdce = list(client.query(query_xdce).result())[0].get('count')
    print(f"   👉 搜索 '%XDCE%' (如 C9999.XDCE): 找到 {count_xdce} 条")

    # Test 2: DCE (后端代码转换后的格式)
    query_dce = f"""
        SELECT COUNT(*) as count FROM `{full_table_id}` 
        WHERE symbol LIKE '%DCE%' AND symbol NOT LIKE '%XDCE%' AND date >= '{target_date}'
    """
    count_dce = list(client.query(query_dce).result())[0].get('count')
    print(f"   👉 搜索 '%DCE%' (如 C9999.DCE, 不含X): 找到 {count_dce} 条")

    # 5. 结论建议
    print("\n--- 诊断结论 ---")
    if count_xdce > 0 and count_dce == 0:
        print("🔴 问题定位: 您的数据库存的是 'XDCE' 格式，但后端代码在查询前把 'X' 去掉了。")
        print("✅ 解决办法: 我需要修改 backend/main.py，去掉 normalize_bq_symbol 函数里的转换逻辑，让它直接查 XDCE。")
    elif count_xdce == 0 and count_dce == 0:
        print("🔴 问题定位: 即使在 2025-12月，也没有查到任何包含 DCE 或 XDCE 的数据。")
        print("   可能原因: 数据导入 BigQuery 失败，或者时间戳格式有问题。")
    else:
        print("🟢 数据看起来没问题，可能是前端日期范围传错了。")

if __name__ == "__main__":
    debug_bigquery()
