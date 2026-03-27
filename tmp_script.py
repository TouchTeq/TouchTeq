import pathlib
path = pathlib.Path('app/api/chat/route.ts')
for i,line in enumerate(path.read_text().splitlines(),1):
    if 158 <= i <= 168:
        print(i, repr(line))
