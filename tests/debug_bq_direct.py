
import os
import sys
import glob
from google.cloud import bigquery
from google.oauth2.service_account import Credentials

# --- 配置区域 ---
# 自动搜索以下路径
SEARCH_PATHS = [
    "service_account.json",
    "/content/service_account.json",
    "./service_account.json",
    "../service_account.json"
]

DATASET_ID = "quant_database"
TABLE_ID = "futures_1min"

def find_key_file():
    print(f"📂 当前工作目录 (CWD): {os.getcwd()}")
    print("👀 正在当前目录下查找文件...")
    files = os.listdir(os.getcwd())
    print(f"   发现文件: {files}")
    
    for path in SEARCH_PATHS:
        if os.path.exists(path):
            print(f"✅ 找到密钥文件: {path}")
            return path
    
    # 如果还没找到，尝试模糊搜索
    print("⚠️ 精确路径未找到，尝试搜索所有 .json 文件...")
    json_files = glob.glob("*.json") + glob.glob("/content/*.json")
    for f in json_files:
        if "service" in f or "account" in f or "key" in f:
            print(f"❓ 发现疑似密钥文件: {f}")
            return f
            
    return None

def debug_bigquery():
    print("🚀 开始 BigQuery 深度诊断 (增强版)...")

    # 1. 智能查找密钥
    key_path = find_key_file()
    
    if not key_path:
        print("\n❌ 致命错误: Python 环境无法读取 'service_account.json'。")
        print("   虽然您在左侧看到了它，但 Python 没看到。")
        print("   尝试方法: 右键点击左侧的 json 文件 -> '复制路径' (Copy path)，然后手动修改代码中的 KEY_PATH。")
        return

    try:
        creds = Credentials.from_service_account_file(key_path)
        client = bigquery.Client(credentials=creds, project=creds.project_id)
        project = client.project
        print(f"✅ 认证成功! Project ID: {project}")
    except Exception as e:
        print(f"❌ 认证失败 (文件可能损坏或格式错误): {str(e)}")
        return

    full_table_id = f"{project}.{DATASET_ID}.{TABLE_ID}"
    print(f"🔍 正在检查表: {full_table_id}")

    # 2. 检查表是否存在 & 查看表结构
    try:
        table = client.get_table(full_table_id)
        print(f"✅ 表存在。行数: {table.num_rows} 行")
        print("📋 表结构 (Schema):")
        column_names = []
        for schema in table.schema:
            print(f"   - {schema.name} ({schema.field_type})")
            column_names.append(schema.name)
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
    except Exception as e:
        print(f"❌ 查询失败: {str(e)}")

    # 4. 关键字段深度分析
    # 我们需要找到代表 "合约代码" 的字段，通常是 contract, symbol, code 等
    target_col = None
    if 'contract' in column_names: target_col = 'contract'
    elif 'symbol' in column_names: target_col = 'symbol'
    elif 'code' in column_names: target_col = 'code'
    
    if target_col:
        print(f"\n🕵️‍♀️ 深入分析字段: '{target_col}'")
        
        # 4.1 列出所有不重复的合约代码 (Limit 50)
        print(f"   正在提取前 50 个不重复的合约代码...")
        query_distinct = f"""
            SELECT DISTINCT {target_col} 
            FROM `{full_table_id}` 
            LIMIT 50
        """
        distinct_rows = list(client.query(query_distinct).result())
        print(f"   👉 发现 {len(distinct_rows)} 个不同合约，示例:")
        for r in distinct_rows:
            print(f"      [{r[0]}]")

        # 4.2 统计每个合约的时间范围
        print(f"\n   正在统计各合约的数据量和时间跨度 (Top 10)...")
        # 假设时间字段是 timestamp 或 timestamp_field_0
        time_col = 'timestamp' if 'timestamp' in column_names else 'timestamp_field_0'
        
        query_stats = f"""
            SELECT 
                {target_col},
                COUNT(*) as total_rows,
                MIN({time_col}) as start_time,
                MAX({time_col}) as end_time
            FROM `{full_table_id}`
            GROUP BY {target_col}
            ORDER BY total_rows DESC
            LIMIT 10
        """
        stats_rows = list(client.query(query_stats).result())
        print(f"   {'合约代码':<20} | {'行数':<10} | {'开始时间'} -> {'结束时间'}")
        print("-" * 70)
        for r in stats_rows:
            code = str(r[0])
            count = str(r[1])
            start = str(r[2])
            end = str(r[3])
            print(f"   {code:<20} | {count:<10} | {start} -> {end}")

    else:
        print("\n❌ 无法自动识别合约代码字段。请参考上面的表结构手动指定。")

if __name__ == "__main__":
    debug_bigquery()
