# Flutter Development with Claude Code - Best Practices

> Based on official Flutter MCP Server docs, dart-lang/ai repo, and community insights.

## Table of Contents
- [MCP Server Setup](#mcp-server-setup)
- [Available Tools](#available-tools)
- [Model Generation](#model-generation)
- [Best Practices](#best-practices)
- [Workflow](#workflow)
- [Prompting Tips](#prompting-tips)

---

## MCP Server Setup

### For Claude Code
```bash
claude mcp add --transport stdio dart -- dart mcp-server --force-roots-fallback
```

### Requirements
- Dart 3.9+ / Flutter 3.35+
- MCP client supporting Tools and Resources

### Alternative Setups

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "dart": {
      "command": "dart",
      "args": ["mcp-server", "--force-roots-fallback"]
    }
  }
}
```

**VS Code with GitHub Copilot** (requires Dart extension v3.116+):
```json
"dart.mcpServer": true
```

---

## Available Tools

### Code Quality
| Tool | Description |
|------|-------------|
| `analyze_files` | Identify errors across projects |
| `dart_fix` | Apply automated fixes |
| `dart_format` | Format code automatically |
| `hover` | Display type info and documentation |
| `signature_help` | Show API usage assistance |

### Flutter Development
| Tool | Description |
|------|-------------|
| `launch_app` | Start Flutter application |
| `stop_app` | Stop running application |
| `hot_reload` | Update running app (preserves state) |
| `hot_restart` | Restart app (resets state) |
| `list_devices` | Show available targets |

### Widget Inspection
| Tool | Description |
|------|-------------|
| `get_widget_tree` | Inspect UI structure |
| `get_selected_widget` | Get details of selected widget |
| `set_widget_selection_mode` | Enable interactive selection |
| `get_runtime_errors` | Retrieve app errors |

### Package Management
| Tool | Description |
|------|-------------|
| `pub_dev_search` | Search pub.dev for packages |
| `pub` | Execute pub commands (get, add, etc.) |
| `create_project` | Initialize new Dart/Flutter projects |

### Testing
| Tool | Description |
|------|-------------|
| `run_tests` | Execute test suites (preferred over shell) |

---

## Model Generation

### Why Skip build_runner + freezed

| Problem | Impact |
|---------|--------|
| Annotations are "hidden magic" | Hard to debug, no actual code to follow |
| `build_runner` is slow | Especially on large projects |
| `.g.dart` files clutter workspace | Hard to read and debug |
| Not beginner-friendly | Complex setup required |

### Recommended: AI-Generated Plain Dart Models

#### The Model Generation Prompt

Use this generic prompt on any model class:

```
Fix models

1. extends Equatable
2. copyWith method
3. fromJson(String str) factory constructor
4. String toJson method
5. fromMap factory constructor
6. toMap method
7. get props
8. get stringify
```

#### Example Input

```dart
class Product {
  final String id;
  final List<Review> reviews;
  final Map<String, String> similarProducts;
}

class Review {
  final String id;
  final String text;
}
```

#### Example Output

```dart
import 'package:equatable/equatable.dart';
import 'dart:convert';

class Product extends Equatable {
  final String id;
  final List<Review> reviews;
  final Map<String, String> similarProducts;

  const Product({
    required this.id,
    required this.reviews,
    required this.similarProducts,
  });

  Product copyWith({
    String? id,
    List<Review>? reviews,
    Map<String, String>? similarProducts,
  }) {
    return Product(
      id: id ?? this.id,
      reviews: reviews ?? this.reviews,
      similarProducts: similarProducts ?? this.similarProducts,
    );
  }

  factory Product.fromJson(String str) => Product.fromMap(json.decode(str));

  String toJson() => json.encode(toMap());

  factory Product.fromMap(Map<String, dynamic> json) => Product(
    id: json["id"],
    reviews: List<Review>.from(json["reviews"].map((x) => Review.fromMap(x))),
    similarProducts: Map<String, String>.from(json["similarProducts"]),
  );

  Map<String, dynamic> toMap() => {
    "id": id,
    "reviews": List<dynamic>.from(reviews.map((x) => x.toMap())),
    "similarProducts": similarProducts,
  };

  @override
  List<Object?> get props => [id, reviews, similarProducts];

  @override
  bool get stringify => true;
}
```

### Alternative: QuickType Generator

For JSON-first approach, use [QuickType](https://app.quicktype.io/):
1. Paste sample JSON
2. Select Dart language
3. Configure options (fromMap/toMap, copyWith, etc.)
4. Copy generated code

---

## Best Practices

### Do This

| Practice | Reason |
|----------|--------|
| Use `run_tests` MCP tool | Better than shell - integrated analysis |
| Use `pub_dev_search` first | Find packages before installing |
| Let AI generate models | Skip build_runner, get clean readable code |
| Describe goals, not tools | "Add a chart" not "use pub_dev_search" |
| Narrow context in prompts | Don't dump entire widget trees |
| Use `hot_reload` for debugging | Keep app state while fixing issues |
| Verify AI output | Always review generated code |

### Avoid This

| Anti-Pattern | Better Alternative |
|--------------|-------------------|
| `build_runner` + freezed | AI-generated plain Dart models |
| Running `flutter test` in shell | Use `run_tests` MCP tool |
| Passing complex state to prompts | Pass only essential constraints |
| Vague prompts like "fix it" | Specific: "Fix RenderFlex overflow in ListView" |
| Trusting AI blindly | Implement verification mechanisms |

### Morgan's Law for AI

> "Eventually, due to the nature of sampling from a probability distribution, AI will fail to do the thing that must be done."

**Implication:** Build guardrails around AI-generated code:
- User verification before applying changes
- Unit tests for generated models
- Type checking with `dart analyze`

---

## Workflow

### Development Cycle

```
1. Define model structure (just fields)
   │
   ▼
2. Generate full model with AI
   Prompt: "Fix models with Equatable, copyWith, fromJson, toJson, fromMap, toMap"
   │
   ▼
3. Run app
   $ flutter run
   │
   ▼
4. Debug with MCP
   Prompt: "Check for runtime errors and fix layout issues"
   │
   ▼
5. Add features
   Prompt: "Find a suitable package for [feature]"
   │
   ▼
6. Test
   Use run_tests MCP tool
```

### Debugging Layout Issues

Effective prompt:
```
Check for and fix static and runtime analysis issues.
Check for and fix any layout issues.
```

What happens behind the scenes:
1. AI gets runtime errors from running app
2. Accesses widget tree to understand layout
3. Proposes and applies fix
4. Verifies no remaining errors

### Adding Dependencies

Effective prompt:
```
Find a suitable package to add a line chart showing user activity over time.
```

What happens:
1. AI searches pub.dev for charting libraries
2. Compares options (fl_chart, syncfusion, etc.)
3. Adds selected package to pubspec.yaml
4. Generates boilerplate code

---

## Prompting Tips

### Prompt Structure

```dart
// System instruction (static rules)
final systemInstruction = '''
You are an expert Flutter developer.
**Rules:**
1. Follow Flutter/Dart style guide
2. Prefer composition over inheritance
3. Use const constructors when possible
4. Handle null safety properly
''';

// User prompt (dynamic task)
String getTaskPrompt(String feature) => '''
Implement: $feature
Constraints:
- Use Material Design 3
- Support dark mode
- Handle loading/error states
''';
```

### Effective Prompts

| Task | Good Prompt |
|------|-------------|
| Fix overflow | "Fix RenderFlex overflow in the ProductList widget" |
| Add feature | "Add pull-to-refresh to the home screen ListView" |
| Debug | "Check runtime errors and fix the layout issue causing overflow" |
| Find package | "Find a package for handling image caching with placeholder support" |

### Avoid These Prompts

| Bad | Why | Better |
|-----|-----|--------|
| "Fix it" | Too vague | "Fix the null check error in user_model.dart" |
| "Make it faster" | No specific target | "Optimize the ListView in browse_screen.dart by adding itemExtent" |
| "Use pub_dev_search" | Specifying tools | "Find a suitable animation package" |

---

## ThuluBazaar-Specific Notes

### Matching API Structure

Since the web app uses transformers for DB-to-API conversion, Flutter models should match:

```dart
// Match your API response structure (camelCase)
class Ad extends Equatable {
  final int id;
  final String title;
  final double price;
  final String? imageUrl;  // Matches API's camelCase
  final DateTime createdAt;
  // ...
}
```

### Shared Types Consideration

Consider creating a shared types approach:
- Web: `packages/types` (TypeScript)
- Mobile: `lib/core/models/` (Dart)
- Keep field names consistent between both

---

## Resources

- [Flutter MCP Server Docs](https://docs.flutter.dev/ai/mcp-server)
- [Flutter AI Best Practices](https://docs.flutter.dev/ai/best-practices)
- [dart-lang/ai GitHub](https://github.com/dart-lang/ai/tree/main/pkgs/dart_mcp_server)
- [QuickType Generator](https://app.quicktype.io/)
- [Equatable Package](https://pub.dev/packages/equatable)
