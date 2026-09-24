import json
W,H=30,17
FONT={
'0':["111","101","101","101","111"],'2':["111","001","111","100","111"],
'6':["111","100","111","101","111"],'N':["1001","1101","1011","1001","1001"],
'I':["111","010","010","010","111"],'C':["111","100","100","100","111"],
'E':["111","100","110","100","111"],'G':["111","100","101","101","111"],'!':["1","1","1","0","1"]}
class R:
    def __init__(s,theme,title,door,auto=False):
        s.g=[[' ']*W for _ in range(H)];s.theme=theme;s.title=title;s.door=door;s.auto=auto
        s.rect(0,0,W-1,H-1,'#',hollow=True)
    def rect(s,x0,y0,x1,y1,c,hollow=False):
        for y in range(y0,y1+1):
            for x in range(x0,x1+1):
                if not hollow or x in(x0,x1) or y in(y0,y1): s.g[y][x]=c
    def p(s,x,y,c): s.g[y][x]=c
    def text(s,t,x,y,c):
        for ch in t:
            f=FONT[ch]
            for dy,row in enumerate(f):
                for dx,v in enumerate(row):
                    if v=='1': s.g[y+dy][x+dx]=c
            x+=len(f[0])+1
    def out(s):
        d={"theme":s.theme,"title":s.title,"door":s.door,"map":["".join(r) for r in s.g]}
        if s.auto: d['auto']=True
        return d
rooms=[]
# 1 Countdown: year written in switch blocks, door on the centre pedestal, big gem cluster right
r=R("day","Ring in the year","switch")
r.rect(1,15,28,16,'#'); r.rect(1,8,28,8,'#')
r.text("2026",7,2,'T')
r.rect(12,12,16,14,'#'); r.p(14,9,'S'); r.p(14,11,'D')
r.p(1,14,'i'); r.p(2,14,'@'); r.p(5,14,'r')
for x in(23,24,25): r.p(x,13,'o')
r.p(24,12,'o')
rooms.append(r.out())
# 2 Launch towers: moles patrol the strip above the room. Each tower rests on two switch blocks;
#   hit one from below in the corridor and the tower jumps up its shaft. Time it as a mole crosses
#   the shaft cap to knock it off; the last mole drops the key down the chute beside the tower.
r=R("day","Launch towers","key")
r.rect(1,1,28,15,'#')
r.rect(1,1,28,3,' ')          # top strip the moles walk along
r.rect(1,12,28,13,' ')        # bottom corridor
r.rect(1,10,3,11,' '); r.rect(26,10,28,11,' ')   # door alcoves
for sx in(7,17):
    r.rect(sx,4,sx+2,11,' '); r.rect(sx,4,sx+2,4,'-')   # shaft (col sx is the chute) with snow-puff cap
    r.p(sx+1,5,'y'); r.p(sx+1,11,'S'); r.p(sx+2,11,'S'); r.p(sx+1,13,'u')
r.rect(12,6,16,11,' ')        # centre chamber
for x in range(12,17): r.p(x,6,'o')
r.p(14,8,'o'); r.p(13,9,'o'); r.p(15,9,'o')
r.p(5,3,'z'); r.p(23,3,'z')
r.p(2,11,'i'); r.p(2,13,'@'); r.p(4,13,'r'); r.p(27,13,'L')
rooms.append(r.out())
# 3 Key drop: small door chamber on the left; the shaft on the right holds a hovering critter
#   carrying the key. Flip the switch to power the cannon, which knocks the key loose; it rides
#   the belt back into the chamber.
r=R("day","Key drop","key")
r.rect(1,14,9,16,'#'); r.rect(9,1,9,11,'#')
r.rect(10,15,28,16,'#'); r.rect(10,14,20,14,'<'); r.rect(21,14,28,14,'#')
r.p(5,10,'S')
for x in(2,3,4,6,7,8): r.p(x,10,'A')
r.p(1,13,'i'); r.p(2,13,'@'); r.p(5,13,'u'); r.p(8,13,'L')
r.p(28,3,'K'); r.p(14,3,'z')
r.rect(17,7,21,7,'-'); r.rect(23,10,27,10,'-')
for x in(18,20): r.p(x,6,'o')
for x in(24,26): r.p(x,9,'o')
r.p(19,6,'e'); r.p(25,9,'e')
rooms.append(r.out())
# 4 Conveyor run: drop in from the top-left ledge, ride the belt right, hit the switch at the far
#   end, come back along the snow-puff row to the bottom-left door
r=R("day","Conveyor run","switch")
r.rect(1,5,4,5,'#'); r.p(1,4,'i'); r.p(2,4,'@'); r.p(4,4,'r')
r.rect(1,15,28,16,'#'); r.rect(1,14,2,14,'#'); r.rect(3,14,27,14,'>'); r.p(28,14,'#')
r.rect(5,10,24,10,'-'); r.p(27,11,'S'); r.p(27,9,'u')
r.p(2,13,'D')
for x in(10,17,22): r.p(x,13,'e')
r.p(14,9,'e')
for x in(8,12,16,20): r.p(x,9,'o')
for x in(24,26): r.p(x,12,'o')
rooms.append(r.out())
# 5 NICE!: message room with a checkpoint flag, door on a pedestal
r=R("day","Nice!","switch",auto=True)
r.rect(1,15,28,16,'#'); r.rect(1,8,28,8,'#')
r.text("NICE!",6,2,'T')
r.p(1,14,'i'); r.p(2,14,'@'); r.p(8,14,'r'); r.p(14,14,'M'); r.p(19,14,'r')
r.rect(24,13,25,14,'#'); r.p(24,12,'D')
for x in(23,26): r.p(x,12,'o')
r.p(26,11,'o')
rooms.append(r.out())
# 6 Boost hoops
r=R("night","Boost hoops","key")
r.rect(1,5,5,5,'#'); r.p(1,4,'i'); r.p(2,4,'@'); r.p(4,4,'r')
r.p(8,4,'R'); r.rect(20,6,28,6,'#'); r.p(25,5,'k')
r.p(17,10,'Q'); r.rect(1,12,7,12,'#'); r.p(3,11,'L')
r.rect(1,15,28,15,'^'); r.rect(1,16,28,16,'#')
for x in(11,13,15): r.p(x,4,'o')
for x in(14,12,10): r.p(x,10,'o')
rooms.append(r.out())
# 7 Cannon alley: switch drops the ice pillar onto the critter and reveals the gem trail up to the
#   exit; a cannon sweeps the floor
r=R("night","Cannon alley","gems")
r.rect(1,11,6,16,'#'); r.p(1,10,'i'); r.p(2,10,'@'); r.p(4,10,'u')
r.p(4,7,'S')
for x in(2,3,5,6): r.p(x,7,'A')
r.rect(7,15,28,16,'#')
r.rect(14,13,15,14,'#'); r.p(14,12,'z'); r.p(14,1,'I')
r.p(28,14,'C')
r.rect(23,5,28,9,'#'); r.p(27,4,'D'); r.p(25,4,'o')
r.rect(18,12,19,12,'-'); r.rect(21,9,22,9,'-'); r.rect(19,6,20,6,'-')
for x in(9,11): r.p(x,13,'h')
for x in(18,19): r.p(x,11,'h')
for x in(21,22): r.p(x,8,'h')
for x in(19,20): r.p(x,5,'h')
r.p(24,3,'h')
rooms.append(r.out())
# 8 Frost flower
r=R("night","Frost flower","key")
r.rect(1,15,28,16,'#'); r.rect(11,12,11,14,'#'); r.rect(18,12,18,14,'#'); r.rect(12,14,17,14,'#')
r.p(14,13,'F')
r.rect(2,9,7,9,'#'); r.p(5,6,'S'); r.rect(8,12,9,12,'A')
r.rect(22,9,27,9,'#'); r.p(24,6,'S'); r.rect(20,12,21,12,'T')
r.p(3,14,'i'); r.p(4,14,'@'); r.p(26,14,'L'); r.p(11,11,'c'); r.p(18,11,'C')
rooms.append(r.out())
# 9 Boss
r=R("night","The snow giant","key")
r.rect(1,15,28,16,'#')
r.rect(1,10,5,10,'#'); r.p(3,7,'S'); r.rect(6,12,8,12,'A')
r.rect(24,10,28,10,'#'); r.p(26,7,'S'); r.rect(21,12,23,12,'T')
r.p(1,9,'i'); r.p(2,9,'@'); r.p(14,14,'Z'); r.p(15,14,'L')
rooms.append(r.out())
# 10 GG!! salute
r=R("day","Good game","switch",auto=True)
r.rect(1,6,5,6,'#'); r.p(1,5,'i'); r.p(2,5,'@'); r.p(4,5,'d')
r.text("GG!!",10,1,'T')
r.rect(6,8,8,16,'#'); r.rect(9,10,11,16,'#'); r.rect(12,12,14,16,'#'); r.rect(15,14,28,16,'#')
for x in range(17,25,2): r.p(x,12,'o')
r.p(26,13,'D')
rooms.append(r.out())
# 11 Epilogue: the year in lights, a heart of switch blocks, goal flag
r=R("day","Happy new year","goal",auto=True)
r.rect(1,15,28,16,'#')
r.text("2026!",6,1,'T')
heart=[" AA AA ","AAAAAAA","AAAATTT"," AATTT ","  ATT  ","   T   "]
for dy,row in enumerate(heart):
    for dx,c in enumerate(row):
        if c!=' ': r.p(12+dx,8+dy,c)
r.rect(2,11,5,11,'-'); r.rect(24,11,27,11,'-')
for x in(3,4): r.p(x,10,'o')
for x in(25,26): r.p(x,10,'o')
r.p(1,14,'i'); r.p(2,14,'@'); r.p(8,14,'r'); r.p(20,14,'r'); r.p(26,14,'G')
rooms.append(r.out())
for i,rm in enumerate(rooms):
    assert len(rm['map'])==H and all(len(l)==W for l in rm['map']),i
    print(i+1,rm['title']); print("\n".join(rm['map']))

# ================= LEVEL 2 =================
for rm in rooms: rm['level']=1
H2=17
def meadow():
    Wd=220; g=[[' ']*Wd for _ in range(H2)]
    for y in range(H2): g[y][0]='#'; g[y][Wd-1]='#'
    # 's' = blocky staircase up: list of (width, ground row)
    segs=[('f',16,13),('s',[(2,11),(2,9),(2,7)]),('f',18,6),('d',7),('f',15),('u',4),('f',8),('d',3),('f',7),('u',4),('f',8),('d',4),('f',30),('u',4),('f',8),('d',6),('f',10),('u',6),('f',8),('d',5),('f',41)]
    x=1;h=13
    for s_ in segs:
        if s_[0]=='f':
            if len(s_)>2:h=s_[2]
            for i in range(s_[1]):
                for y in range(h,H2):g[y][x]='#'
                x+=1
        elif s_[0]=='s':
            for wdt,hh in s_[1]:
                h=hh
                for i in range(wdt):
                    for y in range(h,H2):g[y][x]='#'
                    x+=1
        elif s_[0]=='u':
            for i in range(s_[1]):
                h-=1;g[h][x]='/'
                for y in range(h+1,H2):g[y][x]='#'
                x+=1
        elif s_[0]=='d':
            for i in range(s_[1]):
                g[h][x]='\\'
                for y in range(h+1,H2):g[y][x]='#'
                h+=1;x+=1
    assert x==Wd-1,x
    def p(x,y,c):g[y][x]=c
    # A start: gem crates, first blob, staircase hill
    p(3,12,'@');p(5,12,'r');p(8,9,'b');p(9,9,'b');p(12,6,'b');p(13,6,'b');p(14,12,'e')
    for c in(11,12,13,14):p(c,4,'o')
    for c in(18,20): p(c,8 if c==18 else 6,'o')
    # B hilltop + cliff
    p(26,5,'e');p(36,5,'e')
    for c in(24,26,28):p(c,3,'o')
    p(31,4,'o')
    # C valley: the whirly cap comes out of the crate after the first downhill
    p(52,9,'q');p(53,9,'b')
    p(55,12,'r');p(57,12,'e');p(60,12,'e')
    for c in(49,50,51):p(c,10,'o')
    for c in(70,72):p(c,7,'o')
    p(71,8,'e');p(80,8,'b');p(82,11,'e');p(84,10,'O')
    for c in(76,78):p(c,6,'o')
    # D ring + sky
    for c in range(90,95):p(c,5,'-')
    p(92,4,'b');p(94,7,'u');p(97,3,'R')
    for c in range(106,110):p(c,6,'-')
    for c in(106,108):p(c,4,'o')
    for c in range(113,117):p(c,4,'-')
    for c in(113,115):p(c,2,'o')
    for c in range(120,125):p(c,6,'-')
    p(122,5,'O')
    for c in(105,110,111,118):p(c,3,'o')
    p(108,11,'e');p(112,9,'b');p(113,9,'b');p(114,9,'b');p(116,11,'e');p(124,11,'e');p(127,11,'M')
    # E hilltop + deep valley + burrow
    p(138,7,'e');p(140,7,'e');p(137,4,'m')
    for c in(144,146,148):p(c,8,'o')
    p(152,13,'d');p(153,14,'H');p(156,13,'x');p(150,13,'e')
    p(168,7,'e');p(166,5,'b');p(170,5,'b')
    # F finish
    p(182,12,'e');p(186,12,'e')
    for c in(190,191,192):p(c,9,'b')
    for i,c in enumerate(range(196,204)):
        for y in range(12-i,13):p(c,y,'W')
    for c in(206,208,210):p(c,7,'o')
    p(213,12,'G')
    return {"theme":"grass","title":"Meadow run","door":"goal","level":2,"map":["".join(r) for r in g]}
def cave():
    r=R("cave","Burrow","cave")
    r.rect(1,15,28,16,'#');r.rect(1,3,5,3,'#');r.p(2,2,'@')
    r.rect(8,6,9,14,'W');r.rect(20,6,21,14,'W')
    for c in(11,13,15,17):
        for y in range(7,14):r.p(c,y,'o')
    r.rect(12,2,17,2,'#');r.p(14,3,'O')
    r.rect(2,12,4,12,'-');r.rect(4,9,6,9,'-');r.rect(2,6,4,6,'-')
    r.p(6,14,'e');r.p(27,14,'X')
    d=r.out();d['level']=2;return d
m=meadow();m['sub']=len(rooms)+1;rooms.append(m)
c=cave();c['parent']=len(rooms)-1;rooms.append(c)
json.dump(rooms,open(__import__('os').path.join(__import__('os').path.dirname(__file__),'levels.json'),'w'))
print("\n".join(m['map']))
print("\n".join(c['map']))
