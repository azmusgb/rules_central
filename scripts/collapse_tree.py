import os
from pathlib import Path
import argparse

def collapse_tree(root: Path, depth: int = 2):
    def walk(path: Path, prefix: str, level: int):
        entries = sorted(
            [e for e in path.iterdir() if not e.name.startswith('.')]
        )
        for idx, entry in enumerate(entries):
            connector = "└── " if idx == len(entries) - 1 else "├── "
            if entry.is_dir():
                if level < depth:
                    yield f"{prefix}{connector}{entry.name}/"
                    extension = "    " if idx == len(entries) - 1 else "│   "
                    yield from walk(entry, prefix + extension, level + 1)
                else:
                    count = sum(1 for _ in entry.rglob('*'))
                    yield f"{prefix}{connector}{entry.name}/ ({count} items)"
            else:
                if level < depth:
                    yield f"{prefix}{connector}{entry.name}"
    return '\n'.join(walk(root, '', 0))


def main():
    parser = argparse.ArgumentParser(description="Generate collapsed directory tree")
    parser.add_argument('root', nargs='?', default='.', help='root directory')
    parser.add_argument('-d', '--depth', type=int, default=2, help='max depth to show')
    args = parser.parse_args()
    root = Path(args.root).resolve()
    print(collapse_tree(root, args.depth))


if __name__ == '__main__':
    main()
